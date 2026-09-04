import { Inject, Injectable } from '@nestjs/common';
import { ROBOT_ALARMS_REPOSITORY } from '../repositories/robot-alarm-repository.interface';
import type {
  AlarmDashboardStats,
  IRobotAlarmsRepository,
} from '../repositories/robot-alarm-repository.interface';
import { AlarmDashboardStatsQueryDto } from '../dto/alarm-dashboard-stats-query.dto';

@Injectable()
export class GetAlarmDashboardStatsUseCase {
  constructor(
    @Inject(ROBOT_ALARMS_REPOSITORY)
    private readonly robotAlarmsRepository: IRobotAlarmsRepository,
  ) {}

  execute(query: AlarmDashboardStatsQueryDto): Promise<AlarmDashboardStats> {
    const since = new Date(Date.now() - query.minutes * 60 * 1000);
    return this.robotAlarmsRepository.getDashboardStats(since);
  }
}
