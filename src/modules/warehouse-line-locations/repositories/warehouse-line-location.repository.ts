import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateWarehouseLineLocationData,
  FindAllWarehouseLineLocationsParams,
  FindAllWarehouseLineLocationsResult,
  IWarehouseLineLocationsRepository,
  UpdateWarehouseLineLocationData,
  WarehouseLineLocationWithRelations,
} from './warehouse-line-location-repository.interface';

const NOT_DELETED: Prisma.WarehouseLineLocationWhereInput = {
  deletedAt: null,
};
const RELATIONS_INCLUDE = {
  modelCodeProcess: {
    select: { id: true, name: true, fromSystem: true, isActive: true },
  },
} as const;

@Injectable()
export class WarehouseLineLocationRepository implements IWarehouseLineLocationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllWarehouseLineLocationsParams,
  ): Promise<FindAllWarehouseLineLocationsResult> {
    const where: Prisma.WarehouseLineLocationWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.warehouseLineLocation.findMany({
        where,
        include: RELATIONS_INCLUDE,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.warehouseLineLocation.count({ where }),
    ]);

    return { items: items as WarehouseLineLocationWithRelations[], total };
  }

  findById(id: string) {
    return this.prisma.warehouseLineLocation.findFirst({
      where: { id, ...NOT_DELETED },
      include: RELATIONS_INCLUDE,
    }) as Promise<WarehouseLineLocationWithRelations | null>;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.warehouseLineLocation.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsByDroppingLocationCode(
    code: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.warehouseLineLocation.count({
      where: {
        droppingLocationCode: code,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsByPickingLocationCode(
    code: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.warehouseLineLocation.count({
      where: {
        pickingLocationCode: code,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  create(data: CreateWarehouseLineLocationData) {
    return this.prisma.warehouseLineLocation.create({ data });
  }

  update(id: string, data: UpdateWarehouseLineLocationData) {
    return this.prisma.warehouseLineLocation.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.warehouseLineLocation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
