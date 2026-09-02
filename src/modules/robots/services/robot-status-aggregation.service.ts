import { Inject, Injectable } from '@nestjs/common';
import { ROBOT_ACTIVITY_LOG_REPOSITORY } from '../repositories/robot-activity-log-repository.interface';
import type {
  IRobotActivityLogRepository,
  RobotStatusPoint,
} from '../repositories/robot-activity-log-repository.interface';
import type { RobotStatusDailyMinutes } from '../repositories/robot-status-daily-summary-repository.interface';
import {
  RobotStatusCategory,
  toRobotStatusCategory,
} from '../utils/robot-status-category';

const MS_PER_MINUTE = 60_000;

@Injectable()
export class RobotStatusAggregationService {
  constructor(
    @Inject(ROBOT_ACTIVITY_LOG_REPOSITORY)
    private readonly robotActivityLogRepository: IRobotActivityLogRepository,
  ) {}

  /**
   * Running/Idle/Charging minutes for one robot within [from, to) — walks
   * the robot's RobotActivityLog entries as a sequence of checkpoints and
   * attributes the gap between each pair of consecutive checkpoints to
   * whichever state was active at the start of that gap. `to` may be "now"
   * for a still-in-progress day. Returns null if there's no telemetry data
   * at all for this robot before `to` (nothing to report, as opposed to a
   * legitimately all-zero day).
   */
  async computeMinutes(
    robotId: string,
    from: Date,
    to: Date,
  ): Promise<RobotStatusDailyMinutes | null> {
    const [priorPoint, rangePoints] = await Promise.all([
      this.robotActivityLogRepository.findLastBefore(robotId, from),
      this.robotActivityLogRepository.findRange(robotId, from, to),
    ]);

    if (!priorPoint && rangePoints.length === 0) return null;

    // The gap from `from` up to the first in-range point (if any) belongs to
    // whatever state was already active — either the last known state
    // before `from`, or, failing that, the first in-range point's own state
    // (there's no earlier data to say otherwise).
    const startState = priorPoint?.state ?? rangePoints[0].state;
    const checkpoints: RobotStatusPoint[] = [
      { recordedAt: from, state: startState },
      ...rangePoints,
      // Sentinel closing the final segment — its own state is never read.
      { recordedAt: to, state: null },
    ];

    const totalsMs: Record<RobotStatusCategory, number> = {
      RUNNING: 0,
      IDLE: 0,
      CHARGING: 0,
    };

    for (let i = 0; i < checkpoints.length - 1; i++) {
      const durationMs =
        checkpoints[i + 1].recordedAt.getTime() -
        checkpoints[i].recordedAt.getTime();
      if (durationMs <= 0) continue;
      totalsMs[toRobotStatusCategory(checkpoints[i].state)] += durationMs;
    }

    return {
      runningMinutes: Math.round(totalsMs.RUNNING / MS_PER_MINUTE),
      idleMinutes: Math.round(totalsMs.IDLE / MS_PER_MINUTE),
      chargingMinutes: Math.round(totalsMs.CHARGING / MS_PER_MINUTE),
    };
  }
}
