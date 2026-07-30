import { Inject, Injectable } from '@nestjs/common';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { RobotTelemetryService } from '../services/robot-telemetry.service';

export interface RobotSystemStatus {
  online: boolean;
  checkedAt: string;
}

function isOfflineState(value: unknown): boolean {
  return String(value ?? '')
    .trim()
    .toLowerCase() === 'offline';
}

@Injectable()
export class GetRobotSystemStatusUseCase {
  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
    private readonly robotTelemetryService: RobotTelemetryService,
  ) {}

  // Offline: the telemetry endpoint can't be reached at all, OR it's reached
  // but every known robot is reporting an "Offline" state.
  // Online: the endpoint is reachable AND at least one robot's state is
  // anything other than "Offline".
  async execute(): Promise<RobotSystemStatus> {
    const { items: robots } = await this.robotsRepository.findAll({
      page: 1,
      limit: 1000,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    const areaIds = [...new Set(robots.map((robot) => robot.areaId))];

    if (areaIds.length === 0) {
      return { online: false, checkedAt: new Date().toISOString() };
    }

    const results = await Promise.all(
      areaIds.map((areaId) =>
        this.robotTelemetryService.checkAreaReachable(areaId),
      ),
    );

    const reachable = results.some((result) => result.reachable);
    const devices = results.flatMap((result) => result.devices);
    const hasNonOfflineDevice = devices.some(
      (device) => !isOfflineState(device.state ?? device.status),
    );

    return {
      online: reachable && hasNonOfflineDevice,
      checkedAt: new Date().toISOString(),
    };
  }
}
