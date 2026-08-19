import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ROBOT_ACTIVITY_LOG_REPOSITORY } from '../repositories/robot-activity-log-repository.interface';
import type { IRobotActivityLogRepository } from '../repositories/robot-activity-log-repository.interface';

// RobotActivityLog is written on every telemetry poll (throttled per-robot,
// see RobotActivityLogRepository.createLog) — even throttled, it grows
// without bound over months of continuous use. This caps it by age instead.
const RETENTION_DAYS = 7;

@Injectable()
export class RobotActivityLogRetentionService {
  private readonly logger = new Logger(RobotActivityLogRetentionService.name);

  constructor(
    @Inject(ROBOT_ACTIVITY_LOG_REPOSITORY)
    private readonly robotActivityLogRepository: IRobotActivityLogRepository,
  ) {}

  // Every Sunday at midnight.
  @Cron(CronExpression.EVERY_WEEK)
  async purgeOldLogs(): Promise<void> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const deleted = await this.robotActivityLogRepository.deleteOlderThan(cutoff);
    if (deleted > 0) {
      this.logger.log(
        `Purged ${deleted} RobotActivityLog row(s) older than ${RETENTION_DAYS} days`,
      );
    }
  }
}
