export interface RobotStatusDailyMinutes {
  runningMinutes: number;
  idleMinutes: number;
  chargingMinutes: number;
}

// The persisted/output shape — RobotStatusDailyMinutes (from
// RobotStatusAggregationService, computed off RobotActivityLog only) plus
// alarmMinutes (from RobotAlarmAggregationService, computed off RobotAlarm
// — an independent dimension, since a robot can be simultaneously "Idle"
// and in an active alarm).
export interface RobotStatusMinutesWithAlarm extends RobotStatusDailyMinutes {
  alarmMinutes: number;
}

export interface RobotStatusDailySummaryRecord extends RobotStatusMinutesWithAlarm {
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
    minutes: RobotStatusMinutesWithAlarm,
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
