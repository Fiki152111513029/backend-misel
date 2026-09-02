export interface CreateRobotActivityLogData {
  robotId: string;
  deviceCode: string;
  deviceName: string;
  speed: number | null;
  battery: number | null;
  status: number | null;
  state: string | null;
  position: string | null;
  payload: string | null;
  orientation: number | null;
}

export interface RobotActivityLogRecord {
  id: string;
  robotId: string | null;
  deviceCode: string;
  deviceName: string;
  speed: number | null;
  battery: number | null;
  status: number | null;
  state: string | null;
  position: string | null;
  payload: string | null;
  orientation: number | null;
  recordedAt: Date;
}

export interface FindRobotActivityParams {
  robotId: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

export interface FindRobotActivityResult {
  items: RobotActivityLogRecord[];
  total: number;
}

export const ROBOT_ACTIVITY_LOG_REPOSITORY = 'ROBOT_ACTIVITY_LOG_REPOSITORY';

export interface RobotStatusPoint {
  recordedAt: Date;
  state: string | null;
}

export interface IRobotActivityLogRepository {
  createLog(data: CreateRobotActivityLogData): Promise<void>;
  findByRobot(
    params: FindRobotActivityParams,
  ): Promise<FindRobotActivityResult>;
  // Retention — deletes rows older than the cutoff, returns how many were
  // removed (see RobotActivityLogRetentionService).
  deleteOlderThan(cutoff: Date): Promise<number>;
  // Every recorded state change for this robot within [from, to), ascending
  // by recordedAt — the raw material RobotStatusAggregationService turns
  // into per-status minute totals for one day.
  findRange(robotId: string, from: Date, to: Date): Promise<RobotStatusPoint[]>;
  // The most recent state recorded strictly before `before` — establishes
  // what state the robot was already in at the start of the day being
  // aggregated (the day's own rows only start once something is recorded
  // *during* that day, which could be well after midnight).
  findLastBefore(
    robotId: string,
    before: Date,
  ): Promise<RobotStatusPoint | null>;
}
