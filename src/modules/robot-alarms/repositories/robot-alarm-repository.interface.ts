export interface CreateRobotAlarmData {
  deviceNum?: string;
  deviceName?: string;
  alarmDesc?: string;
  alarmType?: number;
  alarmCode?: string;
  areaId?: number;
  alarmReadFlag?: number;
  channelDeviceId?: string;
  alarmSource?: string;
  channelName?: string;
  alarmDateRaw?: string;
  alarmGrade?: number;
  // RCS's own field: 0 = active, 1 = resolved.
  alarmStatus?: number;
}

export interface AlarmZoneCount {
  areaId: number;
  count: number;
}

// One currently-active alarm — the raw device/desc fields the Dashboard's
// Abnormality panel lists per zone, not just an abstract count.
export interface ActiveAlarmInfo {
  deviceNum: string | null;
  deviceName: string | null;
  alarmType: number | null;
  alarmDesc: string | null;
  alarmGrade: number | null;
  areaId: number | null;
}

export interface AlarmDashboardStats {
  // Count of currently-ACTIVE alarms (see activeAlarms below) that are
  // alarmGrade = 3 (Emergency) — not a time window. An alarm counts here
  // from the moment it's reported active until RCS reports it resolved,
  // however long that takes.
  criticalCount: number;
  // Currently-active alarm counts grouped by areaId, sorted highest first.
  byZone: AlarmZoneCount[];
  // Every currently-active alarm (one per device+alarmCode/alarmType key,
  // whichever alarmStatus was reported most recently) — the same
  // "latest write per key wins" rule as findActiveDeviceNames(), just
  // returning the full row instead of only the device name.
  activeAlarms: ActiveAlarmInfo[];
}

export interface RobotAlarmRecord {
  id: string;
  deviceNum: string | null;
  deviceName: string | null;
  alarmDesc: string | null;
  alarmType: number | null;
  alarmCode: string | null;
  areaId: number | null;
  alarmReadFlag: number | null;
  channelDeviceId: string | null;
  alarmSource: string | null;
  channelName: string | null;
  alarmDateRaw: string | null;
  alarmGrade: number | null;
  // RCS's own field: 0 = active, 1 = resolved.
  alarmStatus: number | null;
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
  getDashboardStats(): Promise<AlarmDashboardStats>;
  findAll(params: FindAllRobotAlarmsParams): Promise<FindAllRobotAlarmsResult>;
  // Used by RobotAlarmRetentionService's daily purge (4-day retention,
  // same convention as RobotActivityLogRetentionService/WebhookLogRetentionService).
  deleteOlderThan(cutoff: Date): Promise<number>;
  // Every alarm event for this device (matched by RobotAlarm.deviceName,
  // which carries the same human-readable "AMR0004"-style value as
  // Robot.amrDeviceSerialNo) received before `upTo`, oldest first — the
  // input RobotAlarmAggregationService walks to pair active/resolved
  // events and compute alarm-downtime minutes.
  findAllForDeviceNameUpTo(
    deviceName: string,
    upTo: Date,
  ): Promise<RobotAlarmRecord[]>;
  // deviceName of every device whose most recent event per alarmCode is
  // still active (alarmStatus=0, no later alarmStatus=1 for that same
  // code) — powers the Factory Map's live alarm badge.
  findActiveDeviceNames(): Promise<string[]>;
}
