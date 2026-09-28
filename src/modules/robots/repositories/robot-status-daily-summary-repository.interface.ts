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
  // Omitting `shiftId` returns every shift's row for that date — the
  // AMR Performance chart's "All Shifts" option, which is also the only
  // thing it can show when no Shift has been configured at all. Callers
  // must then sum the rows per robot themselves, since a robot has one row
  // per shift.
  findAllByDate(
    date: Date,
    shiftId?: string,
  ): Promise<RobotStatusDailySummaryRecord[]>;
  // Every rolled-up day for one robot within [from, to), for one shift or
  // (with `shiftId` omitted) all of them — the raw material for the
  // Average/Total per Month views.
  findRangeByRobot(
    robotId: string,
    shiftId: string | undefined,
    from: Date,
    to: Date,
  ): Promise<RobotStatusDailySummaryRecord[]>;
}
