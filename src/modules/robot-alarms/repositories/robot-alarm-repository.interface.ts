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

export const ROBOT_ALARMS_REPOSITORY = 'ROBOT_ALARMS_REPOSITORY';

export interface IRobotAlarmsRepository {
  create(data: CreateRobotAlarmData): Promise<void>;
  getDashboardStats(since: Date): Promise<AlarmDashboardStats>;
}
