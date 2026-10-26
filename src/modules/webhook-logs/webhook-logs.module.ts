import { Module } from '@nestjs/common';
import { RcsStockStatusModule } from '../rcs-stock-status/rcs-stock-status.module';
import { TasksModule } from '../tasks/tasks.module';
import { WarehouseLocationsModule } from '../warehouse-locations/warehouse-locations.module';
import { WebhookLogController } from './controllers/webhook-log.controller';
import { WEBHOOK_LOGS_REPOSITORY } from './repositories/webhook-log-repository.interface';
import { WebhookLogRepository } from './repositories/webhook-log.repository';
import { GetLatestWebhookStatusUseCase } from './use-cases/get-latest-webhook-status.use-case';
import { GetTaskStatusSummaryUseCase } from './use-cases/get-task-status-summary.use-case';
import { GetWebhookLogsUseCase } from './use-cases/get-webhook-logs.use-case';
import { ReceiveTaskStatusWebhookUseCase } from './use-cases/receive-task-status-webhook.use-case';
import { WebhookLogRetentionService } from './services/webhook-log-retention.service';

@Module({
  // Clearing a Custom Task's pickup node once its rack is lifted needs
  // both: the RCS call, and the list of nodes whose occupancy is tracked.
  imports: [TasksModule, RcsStockStatusModule, WarehouseLocationsModule],
  controllers: [WebhookLogController],
  providers: [
    { provide: WEBHOOK_LOGS_REPOSITORY, useClass: WebhookLogRepository },
    ReceiveTaskStatusWebhookUseCase,
    GetWebhookLogsUseCase,
    GetLatestWebhookStatusUseCase,
    GetTaskStatusSummaryUseCase,
    WebhookLogRetentionService,
  ],
  exports: [WEBHOOK_LOGS_REPOSITORY],
})
export class WebhookLogsModule {}
