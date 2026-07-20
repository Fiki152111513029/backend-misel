import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateEximLocationData,
  FindAllEximLocationsParams,
  FindAllEximLocationsResult,
  IEximLocationsRepository,
  UpdateEximLocationData,
} from './exim-location-repository.interface';

const NOT_DELETED: Prisma.EximLocationWhereInput = { deletedAt: null };

@Injectable()
export class EximLocationRepository implements IEximLocationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllEximLocationsParams,
  ): Promise<FindAllEximLocationsResult> {
    const where: Prisma.EximLocationWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.eximLocation.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.eximLocation.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.eximLocation.findFirst({
      where: { id, ...NOT_DELETED },
    });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.eximLocation.count({
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
    const count = await this.prisma.eximLocation.count({
      where: {
        iRaypleLocationCode: code,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async hasActiveProductionLineAreas(id: string): Promise<boolean> {
    const count = await this.prisma.productionLineArea.count({
      where: { eximLocationId: id, deletedAt: null },
    });
    return count > 0;
  }

  create(data: CreateEximLocationData) {
    return this.prisma.eximLocation.create({ data });
  }

  update(id: string, data: UpdateEximLocationData) {
    return this.prisma.eximLocation.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.eximLocation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
