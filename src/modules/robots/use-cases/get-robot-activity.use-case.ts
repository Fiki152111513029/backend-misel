import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { ROBOT_ACTIVITY_LOG_REPOSITORY } from '../repositories/robot-activity-log-repository.interface';
import type { IRobotActivityLogRepository } from '../repositories/robot-activity-log-repository.interface';
import { RobotActivityQueryDto } from '../dto/robot-activity-query.dto';

@Injectable()
export class GetRobotActivityUseCase {
  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
    @Inject(ROBOT_ACTIVITY_LOG_REPOSITORY)
    private readonly robotActivityLogRepository: IRobotActivityLogRepository,
  ) {}

  async execute(robotId: string, query: RobotActivityQueryDto) {
    const robot = await this.robotsRepository.findById(robotId);
    if (!robot) {
      throw new NotFoundException('Robot not found');
    }

    const { items, total } = await this.robotActivityLogRepository.findByRobot({
      robotId,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      limit: query.limit,
    });

    return {
      robot: { id: robot.id, name: robot.name },
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
