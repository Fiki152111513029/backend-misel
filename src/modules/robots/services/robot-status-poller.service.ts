import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { RobotTelemetryService } from './robot-telemetry.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { RobotPositionBroadcastService } from './robot-position-broadcast.service';

// Every other telemetry fetch in this module is a side effect of an
// incoming HTTP request (the Robots page, Factory Map, etc. polling their
// own endpoints) — meaning RobotActivityLog stops growing the moment nobody
// has a page open. RobotStatusRollupService's daily Running/Idle/Charging
// minute totals need continuous, gap-free data to be meaningful, so this
// polls RCS on its own schedule regardless of frontend activity.
// The map animates between these readings, so this is what sets how current
// a robot marker can be — and how closely the screen tracks the robot you
// are watching on the floor. 2s turned out to be visibly behind reality.
//
// 800ms is what a single open dashboard already cost RCS before the cache
// existed, except this is now the ONLY caller: the load no longer multiplies
// by the number of browsers open, so the old responsiveness comes back
// without the old cost.
const POLL_INTERVAL_MS = 800;

// The 'robots' signal makes every open browser re-fetch the robot list over
// HTTP, so raising the poll rate must not raise the signal rate with it —
// that is exactly how a faster map would overload the API. Positions ride
// the socket on every tick; the signal, which only exists for the slower
// things (fleet status, task counts, charts), is throttled to this.
const SIGNAL_INTERVAL_MS = 10_000;

@Injectable()
export class RobotStatusPollerService {
  private readonly logger = new Logger(RobotStatusPollerService.name);
  private lastSignalAt = 0;
  private polling = false;

  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
    private readonly robotTelemetryService: RobotTelemetryService,
    private readonly positionBroadcast: RobotPositionBroadcastService,
    private readonly realtime: RealtimeService,
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
      // This is the one call that reaches RCS: `refresh` makes it fetch
      // live and repopulate the cache every other reader serves from, and
      // `recordActivity` writes a RobotActivityLog row per robot
      // (throttled, see RobotActivityLogRepository.createLog).
      await this.robotTelemetryService.mergeByDevice(items, {
        refresh: true,
        recordActivity: true,
      });

      // One place builds the position push, whether it was triggered by
      // this poll or by a report arriving on /agv-logs.
      void this.positionBroadcast.broadcast();

      // The signal stays for everything positions do not cover — fleet
      // status, per-robot task counts, the charts — but at its own, much
      // slower cadence. Emitting it every tick would hand back all the HTTP
      // traffic the positions push was meant to remove.
      const now = Date.now();
      if (now - this.lastSignalAt >= SIGNAL_INTERVAL_MS) {
        this.lastSignalAt = now;
        this.realtime.publish('robots');
      }
    } catch (error) {
      this.logger.warn(`Background telemetry poll failed: ${error}`);
    } finally {
      this.polling = false;
    }
  }
}
