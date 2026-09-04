import { Inject, Injectable } from '@nestjs/common';
import { ROBOT_ALARMS_REPOSITORY } from '../repositories/robot-alarm-repository.interface';
import type { IRobotAlarmsRepository } from '../repositories/robot-alarm-repository.interface';
import { RobotAlarmQueryDto } from '../dto/robot-alarm-query.dto';

@Injectable()
export class GetRobotAlarmsUseCase {
  constructor(
    @Inject(ROBOT_ALARMS_REPOSITORY)
    private readonly robotAlarmsRepository: IRobotAlarmsRepository,
  ) {}

  async execute(query: RobotAlarmQueryDto) {
    const { items, total } = await this.robotAlarmsRepository.findAll({
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
