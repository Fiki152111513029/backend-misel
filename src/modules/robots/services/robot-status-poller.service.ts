import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { RobotTelemetryService } from './robot-telemetry.service';

// Every other telemetry fetch in this module is a side effect of an
// incoming HTTP request (the Robots page, Factory Map, etc. polling their
// own endpoints) — meaning RobotActivityLog stops growing the moment nobody
// has a page open. RobotStatusRollupService's daily Running/Idle/Charging
// minute totals need continuous, gap-free data to be meaningful, so this
// polls RCS on its own schedule regardless of frontend activity.
const POLL_INTERVAL_MS = 15_000;

@Injectable()
export class RobotStatusPollerService {
  private readonly logger = new Logger(RobotStatusPollerService.name);
  private polling = false;

  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
    private readonly robotTelemetryService: RobotTelemetryService,
  ) {}

  @Interval(POLL_INTERVAL_MS)
  async poll(): Promise<void> {
    // Skip overlapping runs rather than queue them — if one poll is still
    // in flight (a slow/unreachable RCS call) when the next tick fires,
    // starting another wouldn't get fresher data, just pile up requests.
    if (this.polling) return;
    this.polling = true;

    try {
      const { items } = await this.robotsRepository.findAll({
        page: 1,
        limit: 1000,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      // mergeByDevice fetches live telemetry and — as its own side effect —
      // writes a RobotActivityLog row per robot (throttled, see
      // RobotActivityLogRepository.createLog). The merged result itself
      // isn't needed here.
      await this.robotTelemetryService.mergeByDevice(items);
    } catch (error) {
      this.logger.warn(`Background telemetry poll failed: ${error}`);
    } finally {
      this.polling = false;
    }
  }
}
