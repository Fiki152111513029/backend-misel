import { Inject, Injectable } from '@nestjs/common';
import { RobotQueryDto } from '../dto/robot-query.dto';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { RobotTelemetryService } from '../services/robot-telemetry.service';

@Injectable()
export class GetRobotsUseCase {
  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
    private readonly robotTelemetryService: RobotTelemetryService,
  ) {}

  async execute(query: RobotQueryDto) {
    const { items, total } = await this.robotsRepository.findAll(query);
    const itemsWithTelemetry =
      await this.robotTelemetryService.mergeByDevice(items);

    return {
      items: itemsWithTelemetry,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
