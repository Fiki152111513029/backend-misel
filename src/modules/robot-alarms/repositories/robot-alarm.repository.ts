import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AlarmDashboardStats,
  CreateRobotAlarmData,
  FindAllRobotAlarmsParams,
  FindAllRobotAlarmsResult,
  IRobotAlarmsRepository,
} from './robot-alarm-repository.interface';

// RCS's own severity scale — 1 = Tip, 2 = Alert, 3 = Emergency.
const EMERGENCY_GRADE = 3;

@Injectable()
export class RobotAlarmRepository implements IRobotAlarmsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRobotAlarmData): Promise<{ id: string }> {
    const created = await this.prisma.robotAlarm.create({
      data,
      select: { id: true },
    });
    return created;
  }

  async updateAlarmDetail(id: string, detail: unknown): Promise<void> {
    await this.prisma.robotAlarm.update({
      where: { id },
      data: {
        alarmDetail: detail as never,
        alarmDetailFetchedAt: new Date(),
      },
    });
  }

  async getDashboardStats(since: Date): Promise<AlarmDashboardStats> {
    const [criticalCount, zoneGroups] = await Promise.all([
      this.prisma.robotAlarm.count({
        where: { receivedAt: { gte: since }, alarmGrade: EMERGENCY_GRADE },
      }),
      this.prisma.robotAlarm.groupBy({
        by: ['areaId'],
        where: { receivedAt: { gte: since }, areaId: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const byZone = zoneGroups
      .map((group) => ({
        areaId: group.areaId as number,
        count: group._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    return { criticalCount, byZone };
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
    // Bounded by the 4-day retention window (see RobotAlarmRetentionService)
    // — no device's latest alarm event can be older than that.
    const retentionCutoff = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.robotAlarm.findMany({
      where: {
        receivedAt: { gte: retentionCutoff },
        deviceName: { not: null },
      },
      orderBy: { receivedAt: 'asc' },
      select: {
        deviceName: true,
        alarmCode: true,
        alarmType: true,
        alarmStatus: true,
      },
    });

    // Ascending order means the last write per (device, alarm) key wins —
    // that's this alarm's most recent known status.
    const latestStatusByKey = new Map<string, number | null>();
    for (const row of rows) {
      const key = `${row.deviceName}::${row.alarmCode ?? `type:${row.alarmType}`}`;
      latestStatusByKey.set(key, row.alarmStatus);
    }

    const activeDeviceNames = new Set<string>();
    for (const [key, status] of latestStatusByKey) {
      if (status === 0) {
        activeDeviceNames.add(key.split('::')[0]);
      }
    }
    return [...activeDeviceNames];
  }
}
