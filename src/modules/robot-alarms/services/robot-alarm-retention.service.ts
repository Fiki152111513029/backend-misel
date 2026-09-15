import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ROBOT_ALARMS_REPOSITORY } from '../repositories/robot-alarm-repository.interface';
import type { IRobotAlarmsRepository } from '../repositories/robot-alarm-repository.interface';

// robot_alarms grows without bound as RCS keeps sending alarms — capped by
// age. Part of the "ICS Logs" retention set alongside WebhookLogRetentionService
// (Webhook/API Logs) — same 4-day window, checked daily rather than weekly so
// the cutoff is actually enforced close to 4 days, not up to a week late.
const RETENTION_DAYS = 4;

@Injectable()
export class RobotAlarmRetentionService {
  private readonly logger = new Logger(RobotAlarmRetentionService.name);

  constructor(
    @Inject(ROBOT_ALARMS_REPOSITORY)
    private readonly robotAlarmsRepository: IRobotAlarmsRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeOldAlarms(): Promise<void> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const deleted = await this.robotAlarmsRepository.deleteOlderThan(cutoff);
    if (deleted > 0) {
      this.logger.log(
        `Purged ${deleted} RobotAlarm row(s) older than ${RETENTION_DAYS} days`,
      );
    }
  }
}
