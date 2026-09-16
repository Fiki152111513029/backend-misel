import { Inject, Injectable } from '@nestjs/common';
import { ROBOT_ALARMS_REPOSITORY } from '../repositories/robot-alarm-repository.interface';
import type {
  AlarmDashboardStats,
  IRobotAlarmsRepository,
} from '../repositories/robot-alarm-repository.interface';

@Injectable()
export class GetAlarmDashboardStatsUseCase {
  constructor(
    @Inject(ROBOT_ALARMS_REPOSITORY)
    private readonly robotAlarmsRepository: IRobotAlarmsRepository,
  ) {}

  execute(): Promise<AlarmDashboardStats> {
    return this.robotAlarmsRepository.getDashboardStats();
  }
}
