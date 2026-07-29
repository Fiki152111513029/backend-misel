import { Inject, Injectable } from '@nestjs/common';
import { WEBHOOK_LOGS_REPOSITORY } from '../repositories/webhook-log-repository.interface';
import type { IWebhookLogsRepository } from '../repositories/webhook-log-repository.interface';

export interface LatestWebhookStatus {
  status: string | null;
  subTaskSeq: string | null;
  // ModelCodeProcess.statusComment{subTaskSeq} for the Model Code Process
  // actually used by this task — each one has its own wording per step, so
  // this is resolved live rather than shown as a bare 1-8 number.
  statusComment: string | null;
  receivedAt: Date;
}

@Injectable()
export class GetLatestWebhookStatusUseCase {
  constructor(
    @Inject(WEBHOOK_LOGS_REPOSITORY)
    private readonly webhookLogsRepository: IWebhookLogsRepository,
  ) {}

  async execute(orderId: string): Promise<LatestWebhookStatus | null> {
    const log = await this.webhookLogsRepository.findLatestByOrderId(orderId);
    if (!log) return null;

    const payload =
      log.requestPayload && typeof log.requestPayload === 'object'
        ? (log.requestPayload as Record<string, unknown>)
        : {};

    const subTaskSeq = this.readString(payload, 'subTaskSeq');
    let statusComment: string | null = null;
    if (subTaskSeq) {
      const modelProcessCodeName =
        await this.webhookLogsRepository.findModelProcessCodeNameByOrderId(
          orderId,
        );
      if (modelProcessCodeName) {
        statusComment = await this.webhookLogsRepository.findStatusComment(
          modelProcessCodeName,
          Number(subTaskSeq),
        );
      }
    }

    return {
      status: this.readString(payload, 'status'),
      subTaskSeq,
      statusComment,
      receivedAt: log.createdAt,
    };
  }

  private readString(payload: Record<string, unknown>, key: string): string | null {
    const value = payload[key];
    return value != null && value !== '' ? String(value) : null;
  }
}
