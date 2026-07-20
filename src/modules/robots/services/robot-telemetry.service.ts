import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export interface ExternalDeviceInfo {
  deviceCode?: string;
  deviceName?: string;
  speed?: string | number;
  battery?: string | number;
  status?: string;
  state?: string;
  last_update?: string;
}

export interface RobotTelemetry {
  speed: number | null;
  battery: number | null;
  state: string | null;
  lastUpdate: string | null;
}

interface RobotForMatching {
  areaId: number;
  amrDeviceSerialNo: string;
  amrDeviceNo: string;
}

const NO_TELEMETRY: RobotTelemetry = {
  speed: null,
  battery: null,
  state: null,
  lastUpdate: null,
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

// Node's global fetch() (undici) sends this particular server a request it
// responds to with a generic "request failed" — a plain http/https request
// (same as curl) works correctly, so we use that instead of fetch here.
function postJson(
  targetUrl: string,
  payload: unknown,
  timeoutMs: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const client = url.protocol === 'https:' ? https : http;
    const body = JSON.stringify(payload);

    const request = client.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: timeoutMs,
      },
      (response) => {
        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          data += chunk;
        });
        response.on('end', () => {
          const status = response.statusCode ?? 0;
          if (status < 200 || status >= 300) {
            reject(new Error(`responded with status ${status}`));
            return;
          }
          resolve(data);
        });
      },
    );

    request.on('timeout', () =>
      request.destroy(new Error('request timed out')),
    );
    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

@Injectable()
export class RobotTelemetryService {
  private readonly logger = new Logger(RobotTelemetryService.name);

  constructor(private readonly configService: ConfigService) {}

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
    return {
      speed: Number.isFinite(speed) ? speed : null,
      battery: Number.isFinite(battery) ? battery : null,
      state: device.state ?? device.status ?? null,
      // The device-info endpoint doesn't report its own timestamp — use the
      // moment we successfully matched this device as a stand-in, since the
      // data is fetched live on every poll anyway.
      lastUpdate: device.last_update ?? new Date().toISOString(),
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
      return { ...robot, ...(match ? this.toTelemetry(match) : NO_TELEMETRY) };
    });
  }
}
