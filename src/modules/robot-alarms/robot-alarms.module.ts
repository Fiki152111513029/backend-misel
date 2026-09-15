import { Module } from '@nestjs/common';
import { WebhookLogsModule } from '../webhook-logs/webhook-logs.module';
import { RobotAlarmWebhookController } from './controllers/robot-alarm-webhook.controller';
import { RobotAlarmController } from './controllers/robot-alarm.controller';
import { ROBOT_ALARMS_REPOSITORY } from './repositories/robot-alarm-repository.interface';
import { RobotAlarmRepository } from './repositories/robot-alarm.repository';
import { ReceiveRobotAlarmWebhookUseCase } from './use-cases/receive-robot-alarm-webhook.use-case';
import { GetAlarmDashboardStatsUseCase } from './use-cases/get-alarm-dashboard-stats.use-case';
import { GetRobotAlarmsUseCase } from './use-cases/get-robot-alarms.use-case';
import { RobotAlarmRetentionService } from './services/robot-alarm-retention.service';
import { RobotAlarmAggregationService } from './services/robot-alarm-aggregation.service';
import { RobotAlarmDetailService } from './services/robot-alarm-detail.service';
import { GetActiveAlarmDeviceNamesUseCase } from './use-cases/get-active-alarm-device-names.use-case';
import { GetRobotAlarmDetailUseCase } from './use-cases/get-robot-alarm-detail.use-case';

@Module({
  imports: [WebhookLogsModule],
  controllers: [RobotAlarmWebhookController, RobotAlarmController],
  providers: [
    { provide: ROBOT_ALARMS_REPOSITORY, useClass: RobotAlarmRepository },
    ReceiveRobotAlarmWebhookUseCase,
    GetAlarmDashboardStatsUseCase,
    GetRobotAlarmsUseCase,
    GetActiveAlarmDeviceNamesUseCase,
    RobotAlarmRetentionService,
    RobotAlarmAggregationService,
    RobotAlarmDetailService,
    GetRobotAlarmDetailUseCase,
  ],
  exports: [ROBOT_ALARMS_REPOSITORY, RobotAlarmAggregationService],
})
export class RobotAlarmsModule {}
