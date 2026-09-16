import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ActiveAlarmInfo,
  AlarmDashboardStats,
  CreateRobotAlarmData,
  FindAllRobotAlarmsParams,
  FindAllRobotAlarmsResult,
  IRobotAlarmsRepository,
} from './robot-alarm-repository.interface';

// RCS's own severity scale — 1 = Tip, 2 = Alert, 3 = Emergency.
const EMERGENCY_GRADE = 3;

// Bounded by the 4-day retention window (see RobotAlarmRetentionService) —
// no device's latest alarm event can be older than that.
const RETENTION_WINDOW_MS = 4 * 24 * 60 * 60 * 1000;

interface LatestAlarmRow {
  deviceNum: string | null;
  deviceName: string | null;
  alarmCode: string | null;
  alarmType: number | null;
  alarmDesc: string | null;
  alarmGrade: number | null;
  alarmStatus: number | null;
  areaId: number | null;
}

@Injectable()
export class RobotAlarmRepository implements IRobotAlarmsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRobotAlarmData): Promise<void> {
    await this.prisma.robotAlarm.create({ data });
  }

  async getDashboardStats(): Promise<AlarmDashboardStats> {
    const latestByKey = await this.getLatestAlarmByKey();
    const activeAlarms: ActiveAlarmInfo[] = [...latestByKey.values()]
      .filter((row) => row.alarmStatus === 0)
      .map((row) => ({
        deviceNum: row.deviceNum,
        deviceName: row.deviceName,
        alarmType: row.alarmType,
        alarmDesc: row.alarmDesc,
        alarmGrade: row.alarmGrade,
        areaId: row.areaId,
      }));

    const criticalCount = activeAlarms.filter(
      (alarm) => alarm.alarmGrade === EMERGENCY_GRADE,
    ).length;

    const zoneCounts = new Map<number, number>();
    for (const alarm of activeAlarms) {
      if (alarm.areaId === null) continue;
      zoneCounts.set(alarm.areaId, (zoneCounts.get(alarm.areaId) ?? 0) + 1);
    }
    const byZone = [...zoneCounts.entries()]
      .map(([areaId, count]) => ({ areaId, count }))
      .sort((a, b) => b.count - a.count);

    return { criticalCount, byZone, activeAlarms };
  }

  // Shared "latest write per (deviceName, alarmCode|alarmType) key wins"
  // walk — findActiveDeviceNames() and getDashboardStats() both need this
  // same resolution, just projecting different fields out of it afterward.
  private async getLatestAlarmByKey(): Promise<Map<string, LatestAlarmRow>> {
    const retentionCutoff = new Date(Date.now() - RETENTION_WINDOW_MS);
    const rows = await this.prisma.robotAlarm.findMany({
      where: {
        receivedAt: { gte: retentionCutoff },
        deviceName: { not: null },
      },
      orderBy: { receivedAt: 'asc' },
      select: {
        deviceNum: true,
        deviceName: true,
        alarmCode: true,
        alarmType: true,
        alarmDesc: true,
        alarmGrade: true,
        alarmStatus: true,
        areaId: true,
      },
    });

    // Ascending order means the last write per key wins — that's this
    // alarm's most recent known state.
    const latestByKey = new Map<string, LatestAlarmRow>();
    for (const row of rows) {
      const key = `${row.deviceName}::${row.alarmCode ?? `type:${row.alarmType}`}`;
      latestByKey.set(key, row);
    }
    return latestByKey;
  }

  async findAll(
    params: FindAllRobotAlarmsParams,
  ): Promise<FindAllRobotAlarmsResult> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.robotAlarm.findMany({
        orderBy: { receivedAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.robotAlarm.count(),
    ]);
    return { items, total };
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const result = await this.prisma.robotAlarm.deleteMany({
      where: { receivedAt: { lt: cutoff } },
    });
    return result.count;
  }

  findAllForDeviceNameUpTo(deviceName: string, upTo: Date) {
    return this.prisma.robotAlarm.findMany({
      where: { deviceName, receivedAt: { lt: upTo } },
      orderBy: { receivedAt: 'asc' },
    });
  }

  async findActiveDeviceNames(): Promise<string[]> {
    const latestByKey = await this.getLatestAlarmByKey();
    const activeDeviceNames = new Set<string>();
    for (const row of latestByKey.values()) {
      if (row.alarmStatus === 0 && row.deviceName) {
        activeDeviceNames.add(row.deviceName);
      }
    }
    return [...activeDeviceNames];
  }
}
