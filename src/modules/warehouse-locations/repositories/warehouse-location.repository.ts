import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateWarehouseLocationData,
  FindAllWarehouseLocationsParams,
  FindAllWarehouseLocationsResult,
  IWarehouseLocationsRepository,
  UpdateWarehouseLocationData,
} from './warehouse-location-repository.interface';

const NOT_DELETED: Prisma.WarehouseLocationWhereInput = { deletedAt: null };

@Injectable()
export class WarehouseLocationRepository
  implements IWarehouseLocationsRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllWarehouseLocationsParams,
  ): Promise<FindAllWarehouseLocationsResult> {
    const where: Prisma.WarehouseLocationWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.warehouseLocation.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.warehouseLocation.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.warehouseLocation.findFirst({
      where: { id, ...NOT_DELETED },
    });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.warehouseLocation.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsByLocationCode(
    code: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.warehouseLocation.count({
      where: {
        iRaypleLocationCode: code,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsActiveByLocationCode(code: string): Promise<boolean> {
    const count = await this.prisma.warehouseLocation.count({
      where: { iRaypleLocationCode: code, isActive: true, ...NOT_DELETED },
    });
    return count > 0;
  }

  findActiveByLocationCode(code: string) {
    return this.prisma.warehouseLocation.findFirst({
      where: { iRaypleLocationCode: code, isActive: true, ...NOT_DELETED },
    });
  }

  findFirstActiveEmpty() {
    return this.prisma.warehouseLocation.findFirst({
      where: { isActive: true, status: 'EMPTY', ...NOT_DELETED },
      orderBy: { name: 'asc' },
    });
  }

  create(data: CreateWarehouseLocationData) {
    return this.prisma.warehouseLocation.create({ data });
  }

  update(id: string, data: UpdateWarehouseLocationData) {
    return this.prisma.warehouseLocation.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.warehouseLocation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
