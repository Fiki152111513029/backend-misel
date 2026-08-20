import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ActiveTrolleyActivityByRobot,
  CreateTrolleyActivityData,
  FindAllTrolleyActivitiesParams,
  FindAllTrolleyActivitiesResult,
  ITrolleyActivitiesRepository,
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
    return this.prisma.trolleyActivity.create({ data, include: RELATIONS_INCLUDE });
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
    const [items, total] = await this.prisma.$transaction([
      this.prisma.trolleyActivity.findMany({
        where: NOT_DELETED,
        include: RELATIONS_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.trolleyActivity.count({ where: NOT_DELETED }),
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
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
      },
      include: RELATIONS_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }
}
