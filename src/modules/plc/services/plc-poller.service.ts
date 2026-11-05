import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PlcTag } from '@prisma/client';
import { RealtimeService } from '../../realtime/realtime.service';
import { PLC_REPOSITORY } from '../repositories/plc-repository.interface';
import type {
  IPlcRepository,
  PlcDeviceWithTags,
  PlcReadingInput,
} from '../repositories/plc-repository.interface';
import {
  applyScale,
  decodeWords,
  isBitType,
  MAX_BITS_PER_READ,
  MAX_REGISTERS_PER_READ,
  planBlocks,
  registerCount,
} from './plc-decoder';
import { describe, PlcConnectionService } from './plc-connection.service';
import {
  PlcDeviceSnapshot,
  PlcTagValue,
  PlcValueCacheService,
} from './plc-value-cache.service';

/**
 * How often the loop wakes.
 *
 * Each device carries its own pollIntervalMs, so this is only the grain at
 * which those are honoured — not how often any PLC is actually read.
 */
const TICK_MS = 250;

/** How long the device list is reused before being re-read. */
const ROSTER_TTL_MS = 15_000;

/**
 * A push goes out when a value changes. This forces one anyway, so a quiet
 * device still refreshes its "last read" time and its connection pill
 * instead of looking frozen.
 */
const HEARTBEAT_MS = 5_000;

interface DeviceState {
  nextPollAt: number;
  lastPushAt: number;
  /** Last value per tag, for change detection. */
  lastValues: Map<string, number>;
  running: boolean;
}

/**
 * Reads every active PLC on its own interval and publishes what it finds.
 *
 * The browser never talks to a PLC. One poller serves every open screen,
 * exactly as the robot poller does for RCS — otherwise the load on the PLC
 * would grow with the number of people watching, and a PLC has far less
 * headroom for that than a web server.
 */
@Injectable()
export class PlcPollerService {
  private readonly logger = new Logger(PlcPollerService.name);

  private roster: PlcDeviceWithTags[] = [];
  private rosterAt = 0;
  private readonly states = new Map<string, DeviceState>();

  constructor(
    @Inject(PLC_REPOSITORY)
    private readonly plcRepository: IPlcRepository,
    private readonly connections: PlcConnectionService,
    private readonly cache: PlcValueCacheService,
    private readonly realtime: RealtimeService,
  ) {}

  @Interval(TICK_MS)
  async tick(): Promise<void> {
    let devices: PlcDeviceWithTags[];
    try {
      devices = await this.getRoster();
    } catch (error) {
      this.logger.warn(`Could not load PLC devices: ${describe(error)}`);
      return;
    }

    const now = Date.now();
    for (const device of devices) {
      const state = this.stateFor(device.id);
      // Skipped rather than queued: a PLC slower than its own interval must
      // not accumulate a backlog of reads it will never catch up on.
      if (state.running || now < state.nextPollAt) continue;

      state.running = true;
      void this.pollDevice(device, state).finally(() => {
        state.running = false;
        state.nextPollAt = Date.now() + Math.max(200, device.pollIntervalMs);
      });
    }
  }

  /** Re-reads the device list on the next tick — after an edit or a delete. */
  invalidateRoster(): void {
    this.rosterAt = 0;
  }

  private async pollDevice(
    device: PlcDeviceWithTags,
    state: DeviceState,
  ): Promise<void> {
    const target = {
      id: device.id,
      host: device.host,
      port: device.port,
      unitId: device.unitId,
      timeoutMs: device.timeoutMs,
    };

    const values: PlcTagValue[] = [];
    const changes: PlcReadingInput[] = [];
    let changed = false;

    // One request per group of nearby addresses, not one per tag — see
    // planBlocks. Grouped by register type as well, because the four
    // Modbus address spaces are unrelated and cannot share a read.
    for (const [registerType, tags] of groupByRegisterType(device.tags)) {
      const bits = isBitType(registerType);
      const blocks = planBlocks(
        tags.map((tag) => ({
          start: tag.address,
          length: bits ? 1 : registerCount(tag.dataType),
        })),
        bits ? MAX_BITS_PER_READ : MAX_REGISTERS_PER_READ,
      );

      for (const block of blocks) {
        const inBlock = tags.filter(
          (tag) =>
            tag.address >= block.start &&
            tag.address < block.start + block.length,
        );

        let words: number[] | null = null;
        let failure: string | null = null;
        try {
          words = await this.connections.readBlock(
            target,
            registerType,
            block.start,
            block.length,
          );
        } catch (error) {
          failure = describe(error);
        }

        for (const tag of inBlock) {
          const value = words
            ? decodeTag(tag, words, block.start, bits)
            : { value: null, error: failure };

          values.push({
            tagId: tag.id,
            name: tag.name,
            value: value.value,
            unit: tag.unit,
            address: tag.address,
            registerType: tag.registerType,
            dataType: tag.dataType,
            error: value.error,
            at: new Date().toISOString(),
          });

          if (value.value === null) continue;
          if (state.lastValues.get(tag.id) === value.value) continue;

          state.lastValues.set(tag.id, value.value);
          changed = true;
          if (tag.logEnabled) {
            changes.push({ tagId: tag.id, value: value.value });
          }
        }
      }
    }

    const status = this.connections.status(device.id);
    const previous = this.cache.get(device.id);
    const snapshot: PlcDeviceSnapshot = {
      deviceId: device.id,
      deviceName: device.name,
      host: device.host,
      port: device.port,
      connected: status.connected,
      lastError: status.lastError,
      at: new Date().toISOString(),
      values,
    };
    this.cache.set(snapshot);

    if (changes.length > 0) {
      try {
        await this.plcRepository.recordReadings(changes);
      } catch (error) {
        // The live value is already on screen; losing its history row is
        // not worth failing the poll over.
        this.logger.warn(`Could not store PLC readings: ${describe(error)}`);
      }
    }

    const statusChanged = previous?.connected !== snapshot.connected;
    const stale = Date.now() - state.lastPushAt >= HEARTBEAT_MS;
    if (changed || statusChanged || stale) {
      state.lastPushAt = Date.now();
      this.realtime.publishPlcSnapshot(snapshot);
    }
  }

  private async getRoster(): Promise<PlcDeviceWithTags[]> {
    if (Date.now() - this.rosterAt < ROSTER_TTL_MS) return this.roster;

    const devices = await this.plcRepository.findPollableDevices();
    this.roster = devices;
    this.rosterAt = Date.now();

    // A device switched off or deleted keeps its socket and its card until
    // it is cleared here.
    const live = new Set(devices.map((device) => device.id));
    for (const deviceId of [...this.states.keys()]) {
      if (live.has(deviceId)) continue;
      this.states.delete(deviceId);
      this.connections.close(deviceId);
      this.cache.forget(deviceId);
    }

    return devices;
  }

  private stateFor(deviceId: string): DeviceState {
    const existing = this.states.get(deviceId);
    if (existing) return existing;
    const state: DeviceState = {
      nextPollAt: 0,
      lastPushAt: 0,
      lastValues: new Map(),
      running: false,
    };
    this.states.set(deviceId, state);
    return state;
  }
}

function groupByRegisterType(tags: PlcTag[]) {
  const groups = new Map<PlcTag['registerType'], PlcTag[]>();
  for (const tag of tags) {
    const existing = groups.get(tag.registerType);
    if (existing) existing.push(tag);
    else groups.set(tag.registerType, [tag]);
  }
  return groups;
}

function decodeTag(
  tag: PlcTag,
  words: number[],
  blockStart: number,
  bits: boolean,
): { value: number | null; error: string | null } {
  const offset = tag.address - blockStart;
  const length = bits ? 1 : registerCount(tag.dataType);
  const slice = words.slice(offset, offset + length);

  try {
    const raw = bits
      ? (slice[0] ?? 0)
      : decodeWords(slice, tag.dataType, tag.wordOrder);
    return { value: applyScale(raw, tag.scale), error: null };
  } catch (error) {
    // A decode failure is this one tag's configuration, not the device's —
    // every other tag in the same block still reports normally.
    return { value: null, error: describe(error) };
  }
}
