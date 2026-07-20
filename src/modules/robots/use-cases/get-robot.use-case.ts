import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { RobotTelemetryService } from '../services/robot-telemetry.service';

@Injectable()
export class GetRobotUseCase {
  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
    private readonly robotTelemetryService: RobotTelemetryService,
  ) {}

  async execute(id: string) {
    const robot = await this.robotsRepository.findById(id);
    if (!robot) {
      throw new NotFoundException('Robot not found');
    }
    const [robotWithTelemetry] = await this.robotTelemetryService.mergeByDevice(
      [robot],
    );
    return robotWithTelemetry;
  }
}
