import { Module } from '@nestjs/common';
import { RobotsModule } from '../robots/robots.module';
import { AgvLogController } from './controllers/agv-log.controller';
import { AGV_LOGS_REPOSITORY } from './repositories/agv-log-repository.interface';
import { AgvLogRepository } from './repositories/agv-log.repository';
import { GetAgvLogsUseCase } from './use-cases/get-agv-logs.use-case';
import { ReceiveAgvReportUseCase } from './use-cases/receive-agv-report.use-case';

// Inbound AGV reports from RCS. Mirrors WebhookLogsModule, but kept apart:
// that one drives Task state off order ids, this one only records device
// reports for inspection.
@Module({
  // For RobotTelemetryService: a pushed report updates the live telemetry
  // cache, not just the log table.
  imports: [RobotsModule],
  controllers: [AgvLogController],
  providers: [
    { provide: AGV_LOGS_REPOSITORY, useClass: AgvLogRepository },
    ReceiveAgvReportUseCase,
    GetAgvLogsUseCase,
  ],
  exports: [AGV_LOGS_REPOSITORY],
})
export class AgvLogsModule {}
