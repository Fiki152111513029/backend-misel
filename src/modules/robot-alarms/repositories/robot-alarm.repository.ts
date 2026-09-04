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

  async create(data: CreateRobotAlarmData): Promise<void> {
    await this.prisma.robotAlarm.create({ data });
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
}
