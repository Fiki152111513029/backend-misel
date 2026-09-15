import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { WEBHOOK_LOGS_REPOSITORY } from '../../webhook-logs/repositories/webhook-log-repository.interface';
import type { IWebhookLogsRepository } from '../../webhook-logs/repositories/webhook-log-repository.interface';

export interface RobotAlarmDetailMateriel {
  materielNum: string;
  materielName: string;
  materielAccount: string;
}

export interface RobotAlarmDetailData {
  alarmMsg: string;
  materiel: RobotAlarmDetailMateriel[];
  targetPositionName: string;
  advice: string;
  remark: string;
  startPositionName: string;
  taskTypeName: string;
  startPosition: string;
  alarmFlag: number | null;
  targetPosition: string;
  outOrderId: string;
  taskTemplateName: string;
  shelfNumber: string;
  state: number | null;
  taskId: string;
}

export interface RobotAlarmDetailResponse {
  code: number;
  desc: string;
  data: RobotAlarmDetailData;
}

// Same convention as every other RCS response in this codebase (see
// RobotTelemetryService.controlDevice) — HTTP 200 can still carry a failure
// body, and 1000 (not 0) is RCS's own success code.
const RCS_SUCCESS_CODE = 1000;

// Duplicated from robot-telemetry.service.ts rather than shared — this
// codebase keeps its outbound-RCS-call plumbing local to each module. See
// that file's comment: Node's global fetch() (undici) fails against this
// particular server, so a plain http/https request is used instead.
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
export class RobotAlarmDetailService {
  private readonly logger = new Logger(RobotAlarmDetailService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(WEBHOOK_LOGS_REPOSITORY)
    private readonly webhookLogsRepository: IWebhookLogsRepository,
  ) {}

  /**
   * Fetches the extended abnormality detail (task/materiel context) for one
   * alarm-emitting device from the configured third-party endpoint — POSTs
   * { deviceCode }, expects RCS's own { code, data, desc } envelope back.
   * Every call (success or failure) is logged into webhook_logs, the same
   * request/response record shape used for every other RCS interaction in
   * this app.
   */
  async fetchDetail(deviceCode: string): Promise<RobotAlarmDetailResponse> {
    const url = this.configService.get<string>('robotAlarmDetail.url');
    if (!url) {
      throw new ServiceUnavailableException(
        'Robot alarm detail URL is not configured',
      );
    }

    const requestPayload = { deviceCode };

    let raw: string;
    try {
      raw = await postJson(url, requestPayload, 5000);
    } catch (error) {
      await this.logCall(url, requestPayload, { error: String(error) });
      throw new BadGatewayException(
        `Failed to reach alarm detail endpoint: ${error}`,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      await this.logCall(url, requestPayload, {
        error: `invalid JSON: ${error}`,
        raw,
      });
      throw new BadGatewayException(
        `Alarm detail endpoint returned invalid JSON: ${error}`,
      );
    }

    await this.logCall(url, requestPayload, parsed);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('code' in parsed) ||
      typeof parsed.code !== 'number'
    ) {
      throw new BadGatewayException(
        'Alarm detail endpoint returned an unexpected shape',
      );
    }

    const envelope = parsed as { code: number; desc?: unknown; data?: unknown };
    if (envelope.code !== RCS_SUCCESS_CODE) {
      const desc = typeof envelope.desc === 'string' ? envelope.desc : '';
      throw new BadGatewayException(
        `Alarm detail endpoint rejected the request (code ${envelope.code}): ${desc}`,
      );
    }

    return {
      code: envelope.code,
      desc: typeof envelope.desc === 'string' ? envelope.desc : '',
      data: this.toDetailData(envelope.data),
    };
  }

  private toDetailData(raw: unknown): RobotAlarmDetailData {
    const source = (raw && typeof raw === 'object' ? raw : {}) as Record<
      string,
      unknown
    >;
    return {
      alarmMsg: this.toStringField(source.alarmMsg),
      materiel: this.parseMateriel(source.data),
      targetPositionName: this.toStringField(source.targetPositionName),
      advice: this.toStringField(source.advice),
      remark: this.toStringField(source.remark),
      startPositionName: this.toStringField(source.startPositionName),
      taskTypeName: this.toStringField(source.taskTypeName),
      startPosition: this.toStringField(source.startPosition),
      alarmFlag: this.toNumberField(source.alarmFlag),
      targetPosition: this.toStringField(source.targetPosition),
      outOrderId: this.toStringField(source.outOrderId),
      taskTemplateName: this.toStringField(source.taskTemplateName),
      shelfNumber: this.toStringField(source.shelfNumber),
      state: this.toNumberField(source.state),
      taskId: this.toStringField(source.taskId),
    };
  }

  // `data.data` arrives as a JSON-encoded STRING (RCS's own double-encoding
  // here) holding an array of materiel line items — parsed defensively since
  // a blank/malformed string just means "no materiel for this alarm".
  private parseMateriel(value: unknown): RobotAlarmDetailMateriel[] {
    if (typeof value !== 'string' || !value.trim()) return [];
    try {
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (item): item is Record<string, unknown> =>
            !!item && typeof item === 'object',
        )
        .map((item) => ({
          materielNum: this.toStringField(item.materielNum),
          materielName: this.toStringField(item.materielName),
          materielAccount: this.toStringField(item.materielAccount),
        }));
    } catch (error) {
      this.logger.warn(`Failed to parse alarm detail materiel JSON: ${error}`);
      return [];
    }
  }

  private toStringField(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private toNumberField(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private async logCall(
    endpoint: string,
    requestPayload: unknown,
    responsePayload: unknown,
  ): Promise<void> {
    try {
      await this.webhookLogsRepository.createLog({
        method: 'POST',
        endpoint,
        requestPayload,
        responsePayload,
      });
    } catch (error) {
      this.logger.warn(`Failed to log alarm detail call: ${error}`);
    }
  }
}
