export interface RobotStatusDailyMinutes {
  runningMinutes: number;
  idleMinutes: number;
  chargingMinutes: number;
}

export interface RobotStatusDailySummaryRecord extends RobotStatusDailyMinutes {
  robotId: string;
  date: Date;
}

export const ROBOT_STATUS_DAILY_SUMMARY_REPOSITORY =
  'ROBOT_STATUS_DAILY_SUMMARY_REPOSITORY';

export interface IRobotStatusDailySummaryRepository {
  // One row per (robotId, date, shiftId) — overwrites if the shift was
  // already rolled up (e.g. a retry after a partial failure).
  upsert(
    robotId: string,
    date: Date,
    shiftId: string,
    minutes: RobotStatusDailyMinutes,
  ): Promise<void>;
  findAllByDate(
    date: Date,
    shiftId: string,
  ): Promise<RobotStatusDailySummaryRecord[]>;
  // Every rolled-up day for one robot's given shift within [from, to) —
  // the raw material for the Average/Total per Month views.
  findRangeByRobot(
    robotId: string,
    shiftId: string,
    from: Date,
    to: Date,
  ): Promise<RobotStatusDailySummaryRecord[]>;
}
