import { Injectable } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  BoxTypeForTask,
  CreateTaskData,
  FindAllTasksParams,
  FindAllTasksResult,
  ITasksRepository,
  ProductionLineAreaForTask,
  QuarantineAreaForTask,
  TaskForQuarantineRelease,
  TaskOperatorOption,
  TaskWithRelations,
} from './task-repository.interface';

const NOT_DELETED: Prisma.TaskWhereInput = { deletedAt: null };
const RELATIONS_INCLUDE = {
  productionLine: {
    select: {
      id: true,
      name: true,
      quarantineLine: { select: { id: true, name: true } },
    },
  },
  productionLineArea: { select: { id: true, name: true } },
  quarantineArea: { select: { id: true, name: true } },
  boxType: { select: { id: true, name: true } },
  robot: { select: { id: true, name: true } },
  operator: { select: { id: true, username: true, fullName: true } },
} as const;

@Injectable()
export class TaskRepository implements ITasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindAllTasksParams): Promise<FindAllTasksResult> {
    const where: Prisma.TaskWhereInput = {
      ...NOT_DELETED,
      ...(params.operatorId ? { operatorId: params.operatorId } : {}),
      ...(params.activeOnly
        ? { status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] } }
        : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.taskAction ? { taskAction: params.taskAction } : {}),
      ...(params.dateFrom || params.dateTo
        ? {
            createdAt: {
              ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
              ...(params.dateTo ? { lte: new Date(params.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        include: RELATIONS_INCLUDE,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return { items: items as TaskWithRelations[], total };
  }

  findById(id: string) {
    return this.prisma.task.findFirst({
      where: { id, ...NOT_DELETED },
      include: RELATIONS_INCLUDE,
    }) as Promise<TaskWithRelations | null>;
  }

  findByIdForQuarantineRelease(
    id: string,
  ): Promise<TaskForQuarantineRelease | null> {
    return this.prisma.task.findFirst({
      where: { id, ...NOT_DELETED },
      select: {
        id: true,
        taskId: true,
        quarantineArea: { select: { iRaypleLocationCode: true } },
        productionLineArea: {
          select: {
            eximLocation: { select: { iRaypleLocationCode: true } },
          },
        },
        productionLine: {
          select: {
            quarantineLine: {
              select: { modelCodeProcess: { select: { name: true } } },
            },
          },
        },
        boxType: { select: { fromSystem: true } },
      },
    });
  }

  async findDistinctOperators(): Promise<TaskOperatorOption[]> {
    const rows = await this.prisma.task.findMany({
      where: NOT_DELETED,
      distinct: ['operatorId'],
      select: { operator: { select: { id: true, username: true, fullName: true } } },
      orderBy: { operatorId: 'asc' },
    });
    return rows.map((row) => row.operator);
  }

  findProductionLineAreaWithRelations(
    id: string,
  ): Promise<ProductionLineAreaForTask | null> {
    return this.prisma.productionLineArea.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        iRaypleLocationCode: true,
        productionLine: {
          select: { id: true, operatorId: true, quarantineLineId: true },
        },
        eximLocation: { select: { iRaypleLocationCode: true } },
        emptyPalletLocation: { select: { iRaypleLocationCode: true } },
      },
    });
  }

  findActiveBoxTypeById(id: string): Promise<BoxTypeForTask | null> {
    return this.prisma.boxType.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, modelProcessCode: true, fromSystem: true },
    });
  }

  findFirstActiveQuarantineAreaByLineId(
    quarantineLineId: string,
  ): Promise<QuarantineAreaForTask | null> {
    return this.prisma.quarantineArea.findFirst({
      where: { quarantineLineId, deletedAt: null },
      select: { id: true, iRaypleLocationCode: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(data: CreateTaskData) {
    return this.prisma.task.create({ data });
  }

  updateStatus(id: string, status: TaskStatus) {
    return this.prisma.task.update({ where: { id }, data: { status } });
  }
}
