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

export interface IRobotActivityLogRepository {
  createLog(data: CreateRobotActivityLogData): Promise<void>;
  findByRobot(params: FindRobotActivityParams): Promise<FindRobotActivityResult>;
}
