import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateEmptyPalletLocationData,
  FindAllEmptyPalletLocationsParams,
  FindAllEmptyPalletLocationsResult,
  IEmptyPalletLocationsRepository,
  UpdateEmptyPalletLocationData,
} from './empty-pallet-location-repository.interface';

const NOT_DELETED: Prisma.EmptyPalletLocationWhereInput = { deletedAt: null };

@Injectable()
export class EmptyPalletLocationRepository implements IEmptyPalletLocationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllEmptyPalletLocationsParams,
  ): Promise<FindAllEmptyPalletLocationsResult> {
    const where: Prisma.EmptyPalletLocationWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.emptyPalletLocation.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.emptyPalletLocation.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.emptyPalletLocation.findFirst({
      where: { id, ...NOT_DELETED },
    });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.emptyPalletLocation.count({
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
    const count = await this.prisma.emptyPalletLocation.count({
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
      where: { emptyPalletLocationId: id, deletedAt: null },
    });
    return count > 0;
  }

  create(data: CreateEmptyPalletLocationData) {
    return this.prisma.emptyPalletLocation.create({ data });
  }

  update(id: string, data: UpdateEmptyPalletLocationData) {
    return this.prisma.emptyPalletLocation.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.emptyPalletLocation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
