import { Injectable } from '@nestjs/common';

/** One tag as it was last read. */
export interface PlcTagValue {
  tagId: string;
  name: string;
  /** Already scaled — the same number the history stores. */
  value: number | null;
  unit: string | null;
  address: number;
  registerType: string;
  dataType: string;
  /** Why this tag has no value. Null when the read succeeded. */
  error: string | null;
  at: string;
}

/** Everything the dashboard draws for one device. */
export interface PlcDeviceSnapshot {
  deviceId: string;
  deviceName: string;
  host: string;
  port: number;
  connected: boolean;
  lastError: string | null;
  at: string;
  values: PlcTagValue[];
}

/**
 * The latest reading of every tag, held in memory.
 *
 * Deliberately not read back out of plc_readings: that table stores only
 * changes, so a value that has been steady for an hour has no recent row —
 * "current value" and "value history" are different questions. This also
 * keeps the dashboard off the database entirely on the hot path.
 *
 * Lost on restart, which is correct: after a restart nothing is known
 * about the floor until the poller has been round once.
 */
@Injectable()
export class PlcValueCacheService {
  private readonly snapshots = new Map<string, PlcDeviceSnapshot>();

  set(snapshot: PlcDeviceSnapshot): void {
    this.snapshots.set(snapshot.deviceId, snapshot);
  }

  get(deviceId: string): PlcDeviceSnapshot | null {
    return this.snapshots.get(deviceId) ?? null;
  }

  all(): PlcDeviceSnapshot[] {
    return [...this.snapshots.values()].sort((a, b) =>
      a.deviceName.localeCompare(b.deviceName),
    );
  }

  /** Called when a device is deleted or switched off, so it stops showing. */
  forget(deviceId: string): void {
    this.snapshots.delete(deviceId);
  }
}
