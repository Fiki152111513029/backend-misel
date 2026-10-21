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
  assignees: {
    select: {
      user: { select: { id: true, username: true, fullName: true } },
    },
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
              { code: { contains: params.search, mode: 'insensitive' } },
              { route: { has: params.search.toUpperCase() } },
            ],
          }
        : {}),
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

  findByCode(code: string) {
    return this.prisma.controlTask.findFirst({
      where: { code, ...NOT_DELETED },
      include: WITH_RELATIONS,
    });
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.controlTask.count({
      where: {
        code,
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

  create({ userIds, ...data }: CreateControlTaskData) {
    return this.prisma.controlTask.create({
      data: {
        ...data,
        assignees: userIds?.length
          ? { create: userIds.map((userId) => ({ userId })) }
          : undefined,
      },
      include: WITH_RELATIONS,
    });
  }

  update(id: string, { userIds, ...data }: UpdateControlTaskData) {
    return this.prisma.controlTask.update({
      where: { id },
      data: {
        ...data,
        // Replaced wholesale rather than merged: the form always submits
        // the complete list, so anyone missing from it was removed on
        // purpose. Omitting userIds entirely leaves assignees untouched.
        assignees: userIds
          ? {
              deleteMany: {},
              create: userIds.map((userId) => ({ userId })),
            }
          : undefined,
      },
      include: WITH_RELATIONS,
    });
  }

  findAssignedToUser(userId: string) {
    return this.prisma.controlTask.findMany({
      where: {
        ...NOT_DELETED,
        isActive: true,
        assignees: { some: { userId } },
      },
      include: WITH_RELATIONS,
      orderBy: { name: 'asc' },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.controlTask.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
