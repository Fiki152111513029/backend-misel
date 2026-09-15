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
  // Extended abnormality detail (task/materiel context), fetched
  // automatically right after this event is received — see
  // ReceiveRobotAlarmWebhookUseCase and RobotAlarmDetailService. Null until
  // that fetch completes, or if it failed / the endpoint isn't configured.
  alarmDetail: unknown;
  alarmDetailFetchedAt: Date | null;
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
  // Returns the created row's id so the caller can attach the
  // asynchronously-fetched alarm detail once it resolves (see
  // ReceiveRobotAlarmWebhookUseCase).
  create(data: CreateRobotAlarmData): Promise<{ id: string }>;
  // Fire-and-forget target for the automatic detail fetch — stores whatever
  // RobotAlarmDetailService returned (or leaves it null on failure).
  updateAlarmDetail(id: string, detail: unknown): Promise<void>;
  getDashboardStats(since: Date): Promise<AlarmDashboardStats>;
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
