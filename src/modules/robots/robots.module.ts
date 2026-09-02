import { Module } from '@nestjs/common';
import { WebhookLogsModule } from '../webhook-logs/webhook-logs.module';
import { RobotController } from './controllers/robot.controller';
import { ROBOT_ACTIVITY_LOG_REPOSITORY } from './repositories/robot-activity-log-repository.interface';
import { RobotActivityLogRepository } from './repositories/robot-activity-log.repository';
import { ROBOTS_REPOSITORY } from './repositories/robot-repository.interface';
import { RobotRepository } from './repositories/robot.repository';
import { ROBOT_STATUS_DAILY_SUMMARY_REPOSITORY } from './repositories/robot-status-daily-summary-repository.interface';
import { RobotStatusDailySummaryRepository } from './repositories/robot-status-daily-summary.repository';
import { ControlRobotUseCase } from './use-cases/control-robot.use-case';
import { CreateRobotUseCase } from './use-cases/create-robot.use-case';
import { DeleteRobotUseCase } from './use-cases/delete-robot.use-case';
import { GetFleetStatusUseCase } from './use-cases/get-fleet-status.use-case';
import { GetRobotActivityUseCase } from './use-cases/get-robot-activity.use-case';
import { GetRobotStatusSummaryUseCase } from './use-cases/get-robot-status-summary.use-case';
import { GetRobotSystemStatusUseCase } from './use-cases/get-robot-system-status.use-case';
import { GetRobotUseCase } from './use-cases/get-robot.use-case';
import { GetRobotsUseCase } from './use-cases/get-robots.use-case';
import { UpdateRobotUseCase } from './use-cases/update-robot.use-case';
import { RobotTelemetryService } from './services/robot-telemetry.service';
import { RobotActivityLogRetentionService } from './services/robot-activity-log-retention.service';
import { RobotStatusAggregationService } from './services/robot-status-aggregation.service';
import { RobotStatusPollerService } from './services/robot-status-poller.service';
import { RobotStatusRollupService } from './services/robot-status-rollup.service';

@Module({
  imports: [WebhookLogsModule],
  controllers: [RobotController],
  providers: [
    { provide: ROBOTS_REPOSITORY, useClass: RobotRepository },
    {
      provide: ROBOT_ACTIVITY_LOG_REPOSITORY,
      useClass: RobotActivityLogRepository,
    },
    {
      provide: ROBOT_STATUS_DAILY_SUMMARY_REPOSITORY,
      useClass: RobotStatusDailySummaryRepository,
    },
    RobotTelemetryService,
    RobotActivityLogRetentionService,
    RobotStatusAggregationService,
    RobotStatusPollerService,
    RobotStatusRollupService,
    CreateRobotUseCase,
    GetRobotsUseCase,
    GetRobotUseCase,
    GetRobotActivityUseCase,
    GetRobotStatusSummaryUseCase,
    UpdateRobotUseCase,
    DeleteRobotUseCase,
    ControlRobotUseCase,
    GetRobotSystemStatusUseCase,
    GetFleetStatusUseCase,
  ],
  exports: [ROBOTS_REPOSITORY],
})
export class RobotsModule {}
