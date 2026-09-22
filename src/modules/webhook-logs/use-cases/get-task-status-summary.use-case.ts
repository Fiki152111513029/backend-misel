import { Inject, Injectable } from '@nestjs/common';
import { WEBHOOK_LOGS_REPOSITORY } from '../repositories/webhook-log-repository.interface';
import type {
  IWebhookLogsRepository,
  TaskStatusSummary,
} from '../repositories/webhook-log-repository.interface';

@Injectable()
export class GetTaskStatusSummaryUseCase {
  constructor(
    @Inject(WEBHOOK_LOGS_REPOSITORY)
    private readonly webhookLogsRepository: IWebhookLogsRepository,
  ) {}

  /** Today's task-status breakdown, from midnight (server local time, same
   * day boundary the Dashboard's other "Today" widgets use). */
  execute(): Promise<TaskStatusSummary> {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    return this.webhookLogsRepository.getTaskStatusSummary(since);
  }
}
