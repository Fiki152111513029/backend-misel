import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ROBOT_ACTIVITY_LOG_REPOSITORY } from '../repositories/robot-activity-log-repository.interface';
import type { IRobotActivityLogRepository } from '../repositories/robot-activity-log-repository.interface';
import { postJson } from '../utils/http-client';

export interface ExternalDeviceInfo {
  deviceCode?: string;
  deviceName?: string;
  speed?: string | number;
  battery?: string | number;
  status?: string;
  state?: string;
  last_update?: string;
  // Confirmed against the live API (2026-07-29) — devicePosition is the same
  // location-code vocabulary used throughout the app (e.g. "L3CPA", "QU3").
  // Note the API's own typo: "oritation", not "orientation".
  deviceStatus?: string | number;
  devicePosition?: string;
  payLoad?: string | number;
  oritation?: string | number;
}

export interface RobotTelemetry {
  speed: number | null;
  battery: number | null;
  state: string | null;
  lastUpdate: string | null;
  statusCode: number | null;
  position: string | null;
  payload: string | null;
  orientation: number | null;
}

interface RobotForMatching {
  id: string;
  areaId: number;
  amrDeviceSerialNo: string;
  amrDeviceNo: string;
}

const NO_TELEMETRY: RobotTelemetry = {
  speed: null,
  battery: null,
  state: null,
  lastUpdate: null,
  statusCode: null,
  position: null,
  payload: null,
  orientation: null,
};

function isDeviceLike(item: unknown): item is ExternalDeviceInfo {
  return (
    !!item &&
    typeof item === 'object' &&
    ('deviceCode' in item || 'deviceName' in item)
  );
}

// The external API wraps the device array under an envelope whose exact shape
// isn't documented (e.g. { code, msg, data: [...] } or { data: { list: [...] } }).
// Rather than hardcode one guess, walk the payload for the first array that
// actually looks like a list of devices, at any nesting depth.
function findDeviceArray(
  payload: unknown,
  depth = 0,
): ExternalDeviceInfo[] | null {
  if (depth > 6 || payload == null) return null;

  if (Array.isArray(payload)) {
    if (payload.length === 0 || payload.every(isDeviceLike)) {
      return payload as ExternalDeviceInfo[];
    }
    return null;
  }

  if (typeof payload === 'object') {
    for (const value of Object.values(payload as Record<string, unknown>)) {
      const found = findDeviceArray(value, depth + 1);
      if (found && found.length > 0) return found;
    }
  }

  return null;
}

function extractDeviceList(payload: unknown): ExternalDeviceInfo[] {
  return findDeviceArray(payload) ?? [];
}

@Injectable()
export class RobotTelemetryService {
  private readonly logger = new Logger(RobotTelemetryService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(ROBOT_ACTIVITY_LOG_REPOSITORY)
    private readonly robotActivityLogRepository: IRobotActivityLogRepository,
  ) {}

  /**
   * Raw POST to the external device-info endpoint (same call shape as the
   * reference Python client: { areaId, deviceType } JSON body). Throws on
   * failure so callers hitting this directly (e.g. a debug endpoint) get a
   * real error instead of a silently empty result.
   */
  async fetchRawDeviceInfo(
    areaId: number,
    deviceTypeOverride?: string,
  ): Promise<unknown> {
    const url = this.configService.get<string>('robotTelemetry.url');
    const deviceType =
      deviceTypeOverride ??
      this.configService.get<string>('robotTelemetry.deviceType');
    if (!url) {
      throw new ServiceUnavailableException(
        'Robot telemetry URL is not configured',
      );
    }

    let raw: string;
    try {
      raw = await postJson(url, { areaId, deviceType }, 5000);
    } catch (error) {
      throw new BadGatewayException(
        `Failed to reach robot telemetry endpoint: ${error}`,
      );
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      throw new BadGatewayException(
        `Robot telemetry endpoint returned invalid JSON: ${error}`,
      );
    }
  }

  /**
   * Same call as fetchRawDeviceInfo, but never throws — used by the System
   * Status widget, which needs to tell "endpoint unreachable" apart from
   * "reachable but empty" without an exception aborting the whole check.
   */
  async checkAreaReachable(
    areaId: number,
  ): Promise<{ reachable: boolean; devices: ExternalDeviceInfo[] }> {
    try {
      const data = await this.fetchRawDeviceInfo(areaId);
      return { reachable: true, devices: extractDeviceList(data) };
    } catch {
      return { reachable: false, devices: [] };
    }
  }

  /**
   * Raw POST to the external controlDevice endpoint: { areaId, deviceNumber,
   * controlWay } where controlWay is 0 (Suspend) or 1 (Restore). Throws on
   * failure so the caller can surface a real error to the operator.
   */
  async controlDevice(
    areaId: number,
    deviceNumber: string,
    controlWay: 0 | 1,
  ): Promise<unknown> {
    const url = this.configService.get<string>('robotControl.url');
    if (!url) {
      throw new ServiceUnavailableException(
        'Robot control URL is not configured',
      );
    }

    let raw: string;
    try {
      raw = await postJson(url, { areaId, deviceNumber, controlWay }, 5000);
    } catch (error) {
      throw new BadGatewayException(
        `Failed to reach robot control endpoint: ${error}`,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new BadGatewayException(
        `Robot control endpoint returned invalid JSON: ${error}`,
      );
    }

    // Same RCS convention as the task-order endpoint: HTTP 200 can still carry
    // a failure body. Its success code is 1000, not 0.
    const RCS_SUCCESS_CODE = 1000;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'code' in parsed &&
      typeof (parsed as { code: unknown }).code === 'number' &&
      (parsed as { code: number }).code !== RCS_SUCCESS_CODE
    ) {
      const desc =
        'desc' in parsed ? String((parsed as { desc: unknown }).desc) : '';
      throw new BadGatewayException(
        `Robot control endpoint rejected the request (code ${(parsed as { code: number }).code}): ${desc}`,
      );
    }

    return parsed;
  }

  private async fetchDevicesForArea(
    areaId: number,
  ): Promise<ExternalDeviceInfo[]> {
    const deviceType = this.configService.get<string>(
      'robotTelemetry.deviceType',
    );

    try {
      const data = await this.fetchRawDeviceInfo(areaId, deviceType);
      const devices = extractDeviceList(data);
      this.logger.debug(
        `areaId ${areaId}: found ${devices.length} device(s) — ` +
          devices.map((d) => `${d.deviceCode}/${d.deviceName}`).join(', '),
      );
      if (devices.length === 0) {
        this.logger.warn(
          `areaId ${areaId}: telemetry response had no recognizable device array. Raw keys: ${
            data && typeof data === 'object'
              ? Object.keys(data).join(', ')
              : typeof data
          }`,
        );
      }
      return devices;
    } catch (error) {
      this.logger.warn(
        `Failed to reach robot telemetry endpoint for areaId ${areaId}: ${error}`,
      );
      return [];
    }
  }

  private toTelemetry(device: ExternalDeviceInfo): RobotTelemetry {
    const speed = Number(device.speed);
    const battery = Number(device.battery);
    const statusCode = Number(device.deviceStatus);
    const orientation = Number(device.oritation);
    return {
      speed: Number.isFinite(speed) ? speed : null,
      battery: Number.isFinite(battery) ? battery : null,
      state: device.state ?? device.status ?? null,
      // The device-info endpoint doesn't report its own timestamp — use the
      // moment we successfully matched this device as a stand-in, since the
      // data is fetched live on every poll anyway.
      lastUpdate: device.last_update ?? new Date().toISOString(),
      statusCode: Number.isFinite(statusCode) ? statusCode : null,
      position: device.devicePosition ?? null,
      payload: device.payLoad != null ? String(device.payLoad) : null,
      orientation: Number.isFinite(orientation) ? orientation : null,
    };
  }

  async mergeByDevice<T extends RobotForMatching>(
    robots: T[],
  ): Promise<(T & RobotTelemetry)[]> {
    const areaIds = [...new Set(robots.map((robot) => robot.areaId))];
    const devicesByArea = new Map(
      await Promise.all(
        areaIds.map(
          async (areaId) =>
            [areaId, await this.fetchDevicesForArea(areaId)] as const,
        ),
      ),
    );

    return robots.map((robot) => {
      const devices = devicesByArea.get(robot.areaId) ?? [];
      const serialNo = robot.amrDeviceSerialNo.trim();
      const deviceNo = robot.amrDeviceNo.trim();
      const match = devices.find(
        (device) =>
          String(device.deviceCode ?? '').trim() === serialNo &&
          String(device.deviceName ?? '').trim() === deviceNo,
      );
      const telemetry = match ? this.toTelemetry(match) : NO_TELEMETRY;

      // Fire-and-forget: build up Robot Activity history as a side effect of
      // this poll (the Robots page already polls every 5s), without slowing
      // down or failing this response if logging hiccups.
      if (match) {
        this.robotActivityLogRepository
          .createLog({
            robotId: robot.id,
            deviceCode: String(match.deviceCode ?? serialNo),
            deviceName: String(match.deviceName ?? deviceNo),
            speed: telemetry.speed,
            battery: telemetry.battery,
            status: telemetry.statusCode,
            state: telemetry.state,
            position: telemetry.position,
            payload: telemetry.payload,
            orientation: telemetry.orientation,
          })
          .catch((error) =>
            this.logger.warn(`Failed to record activity log: ${error}`),
          );
      }

      return { ...robot, ...telemetry };
    });
  }
}
