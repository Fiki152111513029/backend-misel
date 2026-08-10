import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateFactoryMapData,
  FindAllFactoryMapsParams,
  FindAllFactoryMapsResult,
  IFactoryMapsRepository,
  UpdateFactoryMapData,
} from './factory-map-repository.interface';

const NOT_DELETED: Prisma.FactoryMapWhereInput = { deletedAt: null };

@Injectable()
export class FactoryMapRepository implements IFactoryMapsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllFactoryMapsParams,
  ): Promise<FindAllFactoryMapsResult> {
    const where: Prisma.FactoryMapWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.factoryMap.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.factoryMap.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.factoryMap.findFirst({ where: { id, ...NOT_DELETED } });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.factoryMap.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsByAreaNumber(
    areaNumber: number,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.factoryMap.count({
      where: {
        areaNumber,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  create(data: CreateFactoryMapData) {
    return this.prisma.factoryMap.create({ data });
  }

  update(id: string, data: UpdateFactoryMapData) {
    return this.prisma.factoryMap.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.factoryMap.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
