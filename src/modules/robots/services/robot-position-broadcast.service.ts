import { Inject, Injectable, Logger } from '@nestjs/common';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { RealtimeService } from '../../realtime/realtime.service';
import { RobotTelemetryService } from './robot-telemetry.service';

/**
 * Floor for how often positions go out.
 *
 * Reports arrive per robot, so a fleet of ten can produce ten calls in a
 * few milliseconds. Broadcasting on each one would send ten near-identical
 * messages; this collapses a burst into a single push carrying all of them.
 * Well under the ~1s the map needs, so nothing is lost by waiting.
 */
const MIN_BROADCAST_INTERVAL_MS = 200;

/** How long the robot list is reused before being re-read from the database. */
const ROSTER_TTL_MS = 30_000;

/**
 * Turns telemetry into the position push the maps draw from.
 *
 * Exists so an AGV report can reach the map immediately instead of waiting
 * for the next poller tick. Reads only the telemetry cache — never RCS and,
 * between roster refreshes, never the database either, so a robot reporting
 * ten times a second costs almost nothing.
 */
@Injectable()
export class RobotPositionBroadcastService {
  private readonly logger = new Logger(RobotPositionBroadcastService.name);

  private roster: { id: string; areaId: number; amrDeviceSerialNo: string; amrDeviceNo: string }[] = [];
  private rosterAt = 0;
  private lastBroadcastAt = 0;
  private pending: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
    private readonly robotTelemetryService: RobotTelemetryService,
    private readonly realtime: RealtimeService,
  ) {}

  /**
   * Asks for a broadcast. Safe to call on every incoming report: calls
   * inside the throttle window are folded into one trailing send rather
   * than dropped, so the last reading always reaches the map.
   */
  schedule(): void {
    if (this.pending) return;

    const since = Date.now() - this.lastBroadcastAt;
    if (since >= MIN_BROADCAST_INTERVAL_MS) {
      void this.broadcast();
      return;
    }

    this.pending = setTimeout(() => {
      this.pending = null;
      void this.broadcast();
    }, MIN_BROADCAST_INTERVAL_MS - since);
  }

  /** Sends straight away, bypassing the throttle — used by the poller. */
  async broadcast(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.lastBroadcastAt = Date.now();

    try {
      const robots = await this.getRoster();
      if (robots.length === 0) return;

      // No refresh: this must never reach RCS. Whatever the cache holds —
      // pushed reports, or the poller's last fetch — is what goes out.
      const merged = await this.robotTelemetryService.mergeByDevice(robots);

      this.realtime.publishRobotPositions(
        merged
          .filter((robot) => robot.positionX != null && robot.positionY != null)
          .map((robot) => ({
            id: robot.id,
            areaId: robot.areaId ?? null,
            x: robot.positionX as number,
            y: robot.positionY as number,
            orientation: robot.orientation ?? 0,
            state: robot.state ?? null,
            battery: robot.battery ?? null,
            payload: robot.payload ?? null,
          })),
      );
    } catch (error) {
      this.logger.warn(`Failed to broadcast robot positions: ${error}`);
    } finally {
      this.running = false;
    }
  }

  /**
   * The robot list changes only when someone edits master data, so it is
   * held between refreshes — otherwise every report would cost a database
   * read just to learn which robots exist.
   */
  private async getRoster() {
    if (Date.now() - this.rosterAt < ROSTER_TTL_MS && this.roster.length > 0) {
      return this.roster;
    }
    const { items } = await this.robotsRepository.findAll({
      page: 1,
      limit: 1000,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    this.roster = items;
    this.rosterAt = Date.now();
    return this.roster;
  }
}
