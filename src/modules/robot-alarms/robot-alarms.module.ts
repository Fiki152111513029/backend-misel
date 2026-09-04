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

@Module({
  imports: [WebhookLogsModule],
  controllers: [RobotAlarmWebhookController, RobotAlarmController],
  providers: [
    { provide: ROBOT_ALARMS_REPOSITORY, useClass: RobotAlarmRepository },
    ReceiveRobotAlarmWebhookUseCase,
    GetAlarmDashboardStatsUseCase,
    GetRobotAlarmsUseCase,
    RobotAlarmRetentionService,
  ],
  exports: [ROBOT_ALARMS_REPOSITORY],
})
export class RobotAlarmsModule {}
