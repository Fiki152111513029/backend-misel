import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WEBHOOK_LOGS_REPOSITORY } from '../repositories/webhook-log-repository.interface';
import type { IWebhookLogsRepository } from '../repositories/webhook-log-repository.interface';

// webhook_logs grows without bound as RCS keeps calling in — capped by age,
// same convention as RobotAlarmRetentionService/RobotActivityLogRetentionService.
const RETENTION_DAYS = 4;

@Injectable()
export class WebhookLogRetentionService {
  private readonly logger = new Logger(WebhookLogRetentionService.name);

  constructor(
    @Inject(WEBHOOK_LOGS_REPOSITORY)
    private readonly webhookLogsRepository: IWebhookLogsRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeOldLogs(): Promise<void> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const deleted = await this.webhookLogsRepository.deleteOlderThan(cutoff);
    if (deleted > 0) {
      this.logger.log(
        `Purged ${deleted} WebhookLog row(s) older than ${RETENTION_DAYS} days`,
      );
    }
  }
}
