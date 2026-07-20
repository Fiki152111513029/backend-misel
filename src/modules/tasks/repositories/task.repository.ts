import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  BoxTypeForTask,
  CreateTaskData,
  FindAllTasksParams,
  FindAllTasksResult,
  ITasksRepository,
  ProductionLineAreaForTask,
  QuarantineAreaForTask,
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
    const where: Prisma.TaskWhereInput = { ...NOT_DELETED };

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
}
