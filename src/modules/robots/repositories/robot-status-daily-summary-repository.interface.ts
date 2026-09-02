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
  // One row per (robotId, date) — overwrites if the day was already rolled
  // up (e.g. a retry after a partial failure).
  upsert(
    robotId: string,
    date: Date,
    minutes: RobotStatusDailyMinutes,
  ): Promise<void>;
  findByRobotAndDate(
    robotId: string,
    date: Date,
  ): Promise<RobotStatusDailySummaryRecord | null>;
  findAllByDate(date: Date): Promise<RobotStatusDailySummaryRecord[]>;
}
