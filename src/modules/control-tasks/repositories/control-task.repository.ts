import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateControlTaskData,
  FindAllControlTasksParams,
  FindAllControlTasksResult,
  IControlTasksRepository,
  RouteOption,
  UpdateControlTaskData,
} from './control-task-repository.interface';

const NOT_DELETED: Prisma.ControlTaskWhereInput = { deletedAt: null };

const WITH_RELATIONS = {
  modelCodeProcess: {
    select: { id: true, name: true, fromSystem: true, isActive: true },
  },
} satisfies Prisma.ControlTaskInclude;

@Injectable()
export class ControlTaskRepository implements IControlTasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllControlTasksParams,
  ): Promise<FindAllControlTasksResult> {
    const where: Prisma.ControlTaskWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { abjad: { contains: params.search, mode: 'insensitive' } },
              { route: { has: params.search.toUpperCase() } },
            ],
          }
        : {}),
      ...(params.typeOfGoods ? { typeOfGoods: params.typeOfGoods } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.controlTask.findMany({
        where,
        include: WITH_RELATIONS,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.controlTask.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.controlTask.findFirst({
      where: { id, ...NOT_DELETED },
      include: WITH_RELATIONS,
    });
  }

  findByAbjad(abjad: string) {
    return this.prisma.controlTask.findFirst({
      where: { abjad, ...NOT_DELETED },
      include: WITH_RELATIONS,
    });
  }

  async existsByAbjad(abjad: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.controlTask.count({
      where: {
        abjad,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.controlTask.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async modelCodeProcessExists(id: string): Promise<boolean> {
    const count = await this.prisma.modelCodeProcess.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  // Both location tables feed the same picker — a route leg is just an
  // iRayple location code, and the user is free to mix Production and
  // Warehouse codes in any order.
  async findRouteOptions(): Promise<RouteOption[]> {
    const select = { name: true, iRaypleLocationCode: true } as const;
    const where = { deletedAt: null, isActive: true } as const;
    const orderBy = { name: 'asc' } as const;

    const [production, warehouse] = await this.prisma.$transaction([
      this.prisma.productionLocation.findMany({ where, select, orderBy }),
      this.prisma.warehouseLocation.findMany({ where, select, orderBy }),
    ]);

    return [
      ...production.map((row) => ({ ...row, source: 'PRODUCTION' as const })),
      ...warehouse.map((row) => ({ ...row, source: 'WAREHOUSE' as const })),
    ];
  }

  create(data: CreateControlTaskData) {
    return this.prisma.controlTask.create({
      data,
      include: WITH_RELATIONS,
    });
  }

  update(id: string, data: UpdateControlTaskData) {
    return this.prisma.controlTask.update({
      where: { id },
      data,
      include: WITH_RELATIONS,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.controlTask.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
