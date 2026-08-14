import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateProductionLocationData,
  FindAllProductionLocationsParams,
  FindAllProductionLocationsResult,
  IProductionLocationsRepository,
  UpdateProductionLocationData,
} from './production-location-repository.interface';

const NOT_DELETED: Prisma.ProductionLocationWhereInput = { deletedAt: null };

@Injectable()
export class ProductionLocationRepository
  implements IProductionLocationsRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllProductionLocationsParams,
  ): Promise<FindAllProductionLocationsResult> {
    const where: Prisma.ProductionLocationWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.productionLocation.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.productionLocation.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.productionLocation.findFirst({
      where: { id, ...NOT_DELETED },
    });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.productionLocation.count({
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
    const count = await this.prisma.productionLocation.count({
      where: {
        iRaypleLocationCode: code,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsActiveByLocationCode(code: string): Promise<boolean> {
    const count = await this.prisma.productionLocation.count({
      where: { iRaypleLocationCode: code, isActive: true, ...NOT_DELETED },
    });
    return count > 0;
  }

  create(data: CreateProductionLocationData) {
    return this.prisma.productionLocation.create({ data });
  }

  update(id: string, data: UpdateProductionLocationData) {
    return this.prisma.productionLocation.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.productionLocation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
