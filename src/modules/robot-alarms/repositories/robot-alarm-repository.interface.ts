export interface CreateRobotAlarmData {
  deviceNum?: string;
  deviceName?: string;
  alarmDesc?: string;
  alarmType?: number;
  areaId?: number;
  alarmReadFlag?: number;
  channelDeviceId?: string;
  alarmSource?: string;
  channelName?: string;
  alarmDateRaw?: string;
  alarmGrade?: number;
}

export interface AlarmZoneCount {
  areaId: number;
  count: number;
}

export interface AlarmDashboardStats {
  // Count of alarmGrade = 3 (Emergency) alarms received within the window.
  criticalCount: number;
  // Alarm counts grouped by areaId within the window, sorted highest first.
  byZone: AlarmZoneCount[];
}

export interface RobotAlarmRecord {
  id: string;
  deviceNum: string | null;
  deviceName: string | null;
  alarmDesc: string | null;
  alarmType: number | null;
  areaId: number | null;
  alarmReadFlag: number | null;
  channelDeviceId: string | null;
  alarmSource: string | null;
  channelName: string | null;
  alarmDateRaw: string | null;
  alarmGrade: number | null;
  receivedAt: Date;
}

export interface FindAllRobotAlarmsParams {
  page: number;
  limit: number;
}

export interface FindAllRobotAlarmsResult {
  items: RobotAlarmRecord[];
  total: number;
}

export const ROBOT_ALARMS_REPOSITORY = 'ROBOT_ALARMS_REPOSITORY';

export interface IRobotAlarmsRepository {
  create(data: CreateRobotAlarmData): Promise<void>;
  getDashboardStats(since: Date): Promise<AlarmDashboardStats>;
  findAll(params: FindAllRobotAlarmsParams): Promise<FindAllRobotAlarmsResult>;
  // Used by RobotAlarmRetentionService's weekly purge (7-day retention,
  // same convention as RobotActivityLogRetentionService).
  deleteOlderThan(cutoff: Date): Promise<number>;
}
