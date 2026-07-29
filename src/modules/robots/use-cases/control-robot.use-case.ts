import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { RobotTelemetryService } from '../services/robot-telemetry.service';

@Injectable()
export class ControlRobotUseCase {
  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
    private readonly robotTelemetryService: RobotTelemetryService,
  ) {}

  async execute(id: string, controlWay: 0 | 1) {
    const robot = await this.robotsRepository.findById(id);
    if (!robot) {
      throw new NotFoundException('Robot not found');
    }
    return this.robotTelemetryService.controlDevice(
      robot.areaId,
      robot.amrDeviceNo,
      controlWay,
    );
  }
}
