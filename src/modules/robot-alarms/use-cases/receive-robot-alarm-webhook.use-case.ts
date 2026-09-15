import { Inject, Injectable, Logger } from '@nestjs/common';
import { ROBOT_ALARMS_REPOSITORY } from '../repositories/robot-alarm-repository.interface';
import type { IRobotAlarmsRepository } from '../repositories/robot-alarm-repository.interface';
import { WEBHOOK_LOGS_REPOSITORY } from '../../webhook-logs/repositories/webhook-log-repository.interface';
import type { IWebhookLogsRepository } from '../../webhook-logs/repositories/webhook-log-repository.interface';
import { RobotAlarmDetailService } from '../services/robot-alarm-detail.service';

@Injectable()
export class ReceiveRobotAlarmWebhookUseCase {
  private readonly logger = new Logger(ReceiveRobotAlarmWebhookUseCase.name);

  constructor(
    @Inject(ROBOT_ALARMS_REPOSITORY)
    private readonly robotAlarmsRepository: IRobotAlarmsRepository,
    @Inject(WEBHOOK_LOGS_REPOSITORY)
    private readonly webhookLogsRepository: IWebhookLogsRepository,
    private readonly robotAlarmDetailService: RobotAlarmDetailService,
  ) {}

  async execute(body: Record<string, unknown>) {
    // Always ack 1000, same reasoning as ReceiveTaskStatusWebhookUseCase —
    // RCS retries indefinitely until we do, and a payload we can't parse
    // won't get any more parseable on retry. The raw call is logged below
    // regardless of whether we understood it.
    const responsePayload = { code: 1000, desc: '' };
    const deviceName = this.readString(body, ['deviceName']);

    try {
      const created = await this.robotAlarmsRepository.create({
        deviceNum: this.readString(body, ['deviceNum']),
        deviceName,
        alarmDesc: this.readString(body, ['alarmDesc']),
        alarmType: this.readNumber(body, ['alarmType']),
        alarmCode: this.readString(body, ['alarmCode']),
        areaId: this.readNumber(body, ['areaId']),
        alarmReadFlag: this.readNumber(body, ['alarmReadFlag']),
        channelDeviceId: this.readString(body, ['channelDeviceId']),
        alarmSource: this.readString(body, ['alarmSource']),
        channelName: this.readString(body, ['channelName']),
        alarmDateRaw: this.readString(body, ['alarmDate']),
        alarmGrade: this.readNumber(body, ['alarmGrade']),
        alarmStatus: this.readNumber(body, ['alarmStatus']),
      });

      // Fire-and-forget: fetch the extended abnormality detail for this
      // device from the third-party lookup and attach it to the row just
      // created — never awaited, so a slow/unreachable third party can
      // never delay the ack RCS is waiting on for this webhook call.
      if (deviceName) {
        this.robotAlarmDetailService
          .fetchDetail(deviceName)
          .then((result) =>
            this.robotAlarmsRepository.updateAlarmDetail(
              created.id,
              result.data,
            ),
          )
          .catch((error) =>
            this.logger.warn(
              `Failed to fetch alarm detail for device ${deviceName}: ${error}`,
            ),
          );
      }
    } catch {
      // Swallow — the raw payload is logged below regardless, so nothing is
      // lost; we just couldn't store it as a typed row this time.
    }

    await this.webhookLogsRepository.createLog({
      method: 'POST',
      endpoint: '/webhooks-alarms',
      requestPayload: body,
      responsePayload,
    });

    return responsePayload;
  }

  private readString(
    body: Record<string, unknown>,
    keys: string[],
  ): string | undefined {
    for (const key of keys) {
      const value = body[key];
      if (typeof value === 'string' && value !== '') return value;
      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
    }
    return undefined;
  }

  private readNumber(
    body: Record<string, unknown>,
    keys: string[],
  ): number | undefined {
    for (const key of keys) {
      const value = body[key];
      if (value == null || value === '') continue;
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return undefined;
  }
}
