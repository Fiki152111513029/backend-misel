import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ActiveTrolleyActivityByRobot,
  CompleteTrolleyActivityData,
  CreateOpenTrolleyActivityData,
  CreateTrolleyActivityData,
  DashboardStatsParams,
  DashboardStatsResult,
  FindAllTrolleyActivitiesParams,
  FindAllTrolleyActivitiesResult,
  ITrolleyActivitiesRepository,
  ShiftActivityRow,
} from './trolley-activity-repository.interface';

const NOT_DELETED = { deletedAt: null } as const;
const RELATIONS_INCLUDE = {
  user: { select: { id: true, fullName: true } },
  trolley: { select: { id: true, code: true, name: true } },
  robot: { select: { id: true, name: true } },
} as const;

@Injectable()
export class TrolleyActivityRepository implements ITrolleyActivitiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateTrolleyActivityData) {
    return this.prisma.trolleyActivity.create({
      data,
      include: RELATIONS_INCLUDE,
    });
  }

  createOpen(data: CreateOpenTrolleyActivityData) {
    return this.prisma.trolleyActivity.create({
      data,
      include: RELATIONS_INCLUDE,
    });
  }

  findOpenByTrolleyId(trolleyId: string) {
    return this.prisma.trolleyActivity.findFirst({
      where: { trolleyId, statusEnd: null, ...NOT_DELETED },
      include: RELATIONS_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  completeById(id: string, data: CompleteTrolleyActivityData) {
    return this.prisma.trolleyActivity.update({
      where: { id },
      data,
      include: RELATIONS_INCLUDE,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.trolleyActivity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  findById(id: string) {
    return this.prisma.trolleyActivity.findFirst({
      where: { id, ...NOT_DELETED },
      include: RELATIONS_INCLUDE,
    });
  }

  async findAll(
    params: FindAllTrolleyActivitiesParams,
  ): Promise<FindAllTrolleyActivitiesResult> {
    const where = {
      ...NOT_DELETED,
      ...(params.userId ? { userId: params.userId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.trolleyActivity.findMany({
        where,
        include: RELATIONS_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.trolleyActivity.count({ where }),
    ]);
    return { items, total };
  }

  countByUserUpTo(userId: string, createdAt: Date): Promise<number> {
    return this.prisma.trolleyActivity.count({
      where: { userId, createdAt: { lte: createdAt }, ...NOT_DELETED },
    });
  }

  async updateStatusByTaskId(
    taskId: string,
    status: TaskStatus,
    robotId?: string,
  ): Promise<boolean> {
    const result = await this.prisma.trolleyActivity.updateMany({
      where: { taskId, deletedAt: null },
      data: { status, ...(robotId ? { robotId } : {}) },
    });
    return result.count > 0;
  }

  async findActiveByRobot(): Promise<ActiveTrolleyActivityByRobot[]> {
    const rows = await this.prisma.trolleyActivity.findMany({
      where: {
        ...NOT_DELETED,
        robotId: { not: null },
        statusEnd: { not: null },
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
      },
      select: { robotId: true, statusBeginning: true },
    });
    return rows.map((row) => ({
      robotId: row.robotId as string,
      carrying: row.statusBeginning,
    }));
  }

  findActiveByUser(userId: string) {
    return this.prisma.trolleyActivity.findMany({
      where: {
        ...NOT_DELETED,
        userId,
        statusEnd: { not: null },
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
      },
      include: RELATIONS_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findActiveTaskIdByLocationCode(code: string): Promise<string | null> {
    const activity = await this.prisma.trolleyActivity.findFirst({
      where: {
        ...NOT_DELETED,
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
        trolley: { currentLocationCode: code },
      },
      select: { taskId: true },
      orderBy: { createdAt: 'desc' },
    });
    return activity?.taskId ?? null;
  }

  async getDashboardStats(
    params: DashboardStatsParams,
  ): Promise<DashboardStatsResult> {
    const rows = await this.prisma.trolleyActivity.findMany({
      where: {
        ...NOT_DELETED,
        createdAt: { gte: params.since },
        ...(params.userId ? { userId: params.userId } : {}),
      },
      select: {
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        pickupLocationCode: true,
        droppingLocationCode: true,
        userId: true,
        user: { select: { fullName: true } },
      },
    });

    const totals = {
      total: rows.length,
      completed: 0,
      pending: 0,
      inProgress: 0,
      failed: 0,
    };
    let durationSum = 0;
    let durationCount = 0;
    const dailyMap = new Map<string, { completed: number; failed: number }>();
    const operatorMap = new Map<
      string,
      {
        fullName: string;
        completedCount: number;
        durationSum: number;
        durationCount: number;
      }
    >();
    const locationMap = new Map<string, number>();

    for (const row of rows) {
      if (row.status === TaskStatus.COMPLETED) totals.completed += 1;
      else if (row.status === TaskStatus.PENDING) totals.pending += 1;
      else if (row.status === TaskStatus.IN_PROGRESS) totals.inProgress += 1;
      else if (row.status === TaskStatus.FAILED) totals.failed += 1;

      const dayKey = row.createdAt.toISOString().slice(0, 10);
      const day = dailyMap.get(dayKey) ?? { completed: 0, failed: 0 };
      if (row.status === TaskStatus.COMPLETED) day.completed += 1;
      if (row.status === TaskStatus.FAILED) day.failed += 1;
      dailyMap.set(dayKey, day);

      if (row.status === TaskStatus.COMPLETED && row.endDate) {
        const seconds =
          (row.endDate.getTime() - row.startDate.getTime()) / 1000;
        durationSum += seconds;
        durationCount += 1;

        const operator = operatorMap.get(row.userId) ?? {
          fullName: row.user.fullName,
          completedCount: 0,
          durationSum: 0,
          durationCount: 0,
        };
        operator.completedCount += 1;
        operator.durationSum += seconds;
        operator.durationCount += 1;
        operatorMap.set(row.userId, operator);
      }

      locationMap.set(
        row.pickupLocationCode,
        (locationMap.get(row.pickupLocationCode) ?? 0) + 1,
      );
      if (row.droppingLocationCode) {
        locationMap.set(
          row.droppingLocationCode,
          (locationMap.get(row.droppingLocationCode) ?? 0) + 1,
        );
      }
    }

    const dailyTrend = [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, ...value }));

    const topOperators = [...operatorMap.entries()]
      .map(([userId, value]) => ({
        userId,
        fullName: value.fullName,
        completedCount: value.completedCount,
        avgDurationSeconds: value.durationCount
          ? Math.round(value.durationSum / value.durationCount)
          : null,
      }))
      .sort((a, b) => b.completedCount - a.completedCount)
      .slice(0, 5);

    const topLocations = [...locationMap.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totals,
      avgDurationSeconds: durationCount
        ? Math.round(durationSum / durationCount)
        : null,
      dailyTrend,
      topOperators,
      topLocations,
    };
  }

  async getShiftActivities(from: Date, to: Date): Promise<ShiftActivityRow[]> {
    const rows = await this.prisma.trolleyActivity.findMany({
      where: { ...NOT_DELETED, startDate: { gte: from, lt: to } },
      select: {
        trolleyId: true,
        userId: true,
        status: true,
        startDate: true,
        endDate: true,
        trolley: { select: { code: true, name: true } },
        user: { select: { fullName: true, role: { select: { name: true } } } },
      },
    });
    return rows.map((row) => ({
      trolleyId: row.trolleyId,
      trolleyCode: row.trolley.code,
      trolleyName: row.trolley.name,
      userId: row.userId,
      userFullName: row.user.fullName,
      roleName: row.user.role.name,
      status: row.status,
      startDate: row.startDate,
      endDate: row.endDate,
    }));
  }
}
