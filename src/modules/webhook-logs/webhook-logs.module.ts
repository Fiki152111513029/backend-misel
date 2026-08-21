import { Module } from '@nestjs/common';
import { TrolleysModule } from '../trolleys/trolleys.module';
import { RcsStockStatusModule } from '../rcs-stock-status/rcs-stock-status.module';
import { WebhookLogController } from './controllers/webhook-log.controller';
import { WEBHOOK_LOGS_REPOSITORY } from './repositories/webhook-log-repository.interface';
import { WebhookLogRepository } from './repositories/webhook-log.repository';
import { GetLatestWebhookStatusUseCase } from './use-cases/get-latest-webhook-status.use-case';
import { GetWebhookLogsUseCase } from './use-cases/get-webhook-logs.use-case';
import { ReceiveTaskStatusWebhookUseCase } from './use-cases/receive-task-status-webhook.use-case';

@Module({
  imports: [TrolleysModule, RcsStockStatusModule],
  controllers: [WebhookLogController],
  providers: [
    { provide: WEBHOOK_LOGS_REPOSITORY, useClass: WebhookLogRepository },
    ReceiveTaskStatusWebhookUseCase,
    GetWebhookLogsUseCase,
    GetLatestWebhookStatusUseCase,
  ],
  exports: [WEBHOOK_LOGS_REPOSITORY],
})
export class WebhookLogsModule {}
