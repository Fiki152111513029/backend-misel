import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateWarehouseCartTaskData,
  FindAllWarehouseCartTasksParams,
  FindAllWarehouseCartTasksResult,
  IWarehouseCartTasksRepository,
  WarehouseCartTaskOperatorOption,
  WarehouseCartTaskWithRelations,
} from './warehouse-cart-task-repository.interface';

const NOT_DELETED: Prisma.WarehouseCartTaskWhereInput = { deletedAt: null };
const RELATIONS_INCLUDE = {
  warehouseLineLocation: { select: { id: true, name: true } },
  modelCodeProcess: { select: { id: true, name: true } },
  robot: { select: { id: true, name: true } },
  operator: { select: { id: true, username: true, fullName: true } },
} as const;

@Injectable()
export class WarehouseCartTaskRepository implements IWarehouseCartTasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllWarehouseCartTasksParams,
  ): Promise<FindAllWarehouseCartTasksResult> {
    const where: Prisma.WarehouseCartTaskWhereInput = {
      ...NOT_DELETED,
      ...(params.operatorId ? { operatorId: params.operatorId } : {}),
      ...(params.status ? { status: params.status } : {}),
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
      this.prisma.warehouseCartTask.findMany({
        where,
        include: RELATIONS_INCLUDE,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.warehouseCartTask.count({ where }),
    ]);

    return { items: items as WarehouseCartTaskWithRelations[], total };
  }

  async findDistinctOperators(): Promise<WarehouseCartTaskOperatorOption[]> {
    const rows = await this.prisma.warehouseCartTask.findMany({
      where: NOT_DELETED,
      distinct: ['operatorId'],
      select: { operator: { select: { id: true, username: true, fullName: true } } },
      orderBy: { operatorId: 'asc' },
    });
    return rows.map((row) => row.operator);
  }

  create(data: CreateWarehouseCartTaskData) {
    return this.prisma.warehouseCartTask.create({ data });
  }
}
