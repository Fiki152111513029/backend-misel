import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AGV_LOGS_REPOSITORY } from '../repositories/agv-log-repository.interface';
import type { IAgvLogsRepository } from '../repositories/agv-log-repository.interface';

// agv_logs grows without bound as RCS keeps reporting — capped by age, same
// convention as WebhookLogRetentionService.
const RETENTION_DAYS = 4;

@Injectable()
export class AgvLogRetentionService {
  private readonly logger = new Logger(AgvLogRetentionService.name);

  constructor(
    @Inject(AGV_LOGS_REPOSITORY)
    private readonly agvLogsRepository: IAgvLogsRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeOldLogs(): Promise<void> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const deleted = await this.agvLogsRepository.deleteOlderThan(cutoff);
    if (deleted > 0) {
      this.logger.log(
        `Purged ${deleted} AgvLog row(s) older than ${RETENTION_DAYS} days`,
      );
    }
  }
}
