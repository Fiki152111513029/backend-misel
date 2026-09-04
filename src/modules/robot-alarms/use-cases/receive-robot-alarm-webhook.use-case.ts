import { Inject, Injectable } from '@nestjs/common';
import { ROBOT_ALARMS_REPOSITORY } from '../repositories/robot-alarm-repository.interface';
import type { IRobotAlarmsRepository } from '../repositories/robot-alarm-repository.interface';
import { WEBHOOK_LOGS_REPOSITORY } from '../../webhook-logs/repositories/webhook-log-repository.interface';
import type { IWebhookLogsRepository } from '../../webhook-logs/repositories/webhook-log-repository.interface';

@Injectable()
export class ReceiveRobotAlarmWebhookUseCase {
  constructor(
    @Inject(ROBOT_ALARMS_REPOSITORY)
    private readonly robotAlarmsRepository: IRobotAlarmsRepository,
    @Inject(WEBHOOK_LOGS_REPOSITORY)
    private readonly webhookLogsRepository: IWebhookLogsRepository,
  ) {}

  async execute(body: Record<string, unknown>) {
    // Always ack 1000, same reasoning as ReceiveTaskStatusWebhookUseCase —
    // RCS retries indefinitely until we do, and a payload we can't parse
    // won't get any more parseable on retry. The raw call is logged below
    // regardless of whether we understood it.
    const responsePayload = { code: 1000, desc: '' };

    try {
      await this.robotAlarmsRepository.create({
        deviceNum: this.readString(body, ['deviceNum']),
        deviceName: this.readString(body, ['deviceName']),
        alarmDesc: this.readString(body, ['alarmDesc']),
        alarmType: this.readNumber(body, ['alarmType']),
        areaId: this.readNumber(body, ['areaId']),
        alarmReadFlag: this.readNumber(body, ['alarmReadFlag']),
        channelDeviceId: this.readString(body, ['channelDeviceId']),
        alarmSource: this.readString(body, ['alarmSource']),
        channelName: this.readString(body, ['channelName']),
        alarmDateRaw: this.readString(body, ['alarmDate']),
        alarmGrade: this.readNumber(body, ['alarmGrade']),
      });
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
      if (value != null && value !== '') return String(value);
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
