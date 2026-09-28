import { Inject, Injectable } from '@nestjs/common';
import { WEBHOOK_LOGS_REPOSITORY } from '../repositories/webhook-log-repository.interface';
import type {
  IWebhookLogsRepository,
  TaskStatusSummary,
} from '../repositories/webhook-log-repository.interface';

/**
 * YYYY-MM-DD as a local-time date. `new Date('2026-09-28')` would parse as
 * UTC midnight and land on the previous day for anyone east of UTC, so the
 * parts are passed to the constructor instead.
 */
function parseLocalDateOnly(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

@Injectable()
export class GetTaskStatusSummaryUseCase {
  constructor(
    @Inject(WEBHOOK_LOGS_REPOSITORY)
    private readonly webhookLogsRepository: IWebhookLogsRepository,
  ) {}

  /**
   * One calendar day's task-status breakdown, bounded to that day alone
   * (midnight to midnight, server local time — the same day boundary the
   * Dashboard's other day-scoped widgets use). `date` defaults to today;
   * `areaId` narrows it to the orders run by robots in one Factory Map's
   * area.
   */
  execute(date?: string, areaId?: number): Promise<TaskStatusSummary> {
    const since = date ? parseLocalDateOnly(date) : new Date();
    since.setHours(0, 0, 0, 0);
    const until = new Date(since);
    until.setDate(until.getDate() + 1);
    return this.webhookLogsRepository.getTaskStatusSummary(
      since,
      until,
      areaId,
    );
  }
}
