import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateWarehouseCartTaskData,
  FindAllWarehouseCartTasksParams,
  FindAllWarehouseCartTasksResult,
  IWarehouseCartTasksRepository,
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
    const where: Prisma.WarehouseCartTaskWhereInput = { ...NOT_DELETED };

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

  create(data: CreateWarehouseCartTaskData) {
    return this.prisma.warehouseCartTask.create({ data });
  }
}
