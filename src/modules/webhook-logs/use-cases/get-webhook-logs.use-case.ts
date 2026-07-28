import { Inject, Injectable } from '@nestjs/common';
import { WEBHOOK_LOGS_REPOSITORY } from '../repositories/webhook-log-repository.interface';
import type { IWebhookLogsRepository } from '../repositories/webhook-log-repository.interface';
import { WebhookLogQueryDto } from '../dto/webhook-log-query.dto';

@Injectable()
export class GetWebhookLogsUseCase {
  constructor(
    @Inject(WEBHOOK_LOGS_REPOSITORY)
    private readonly webhookLogsRepository: IWebhookLogsRepository,
  ) {}

  async execute(query: WebhookLogQueryDto) {
    const { items, total } = await this.webhookLogsRepository.findAll({
      page: query.page,
      limit: query.limit,
    });
    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
