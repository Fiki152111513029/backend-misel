import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateTrolleyTypeData,
  FindAllTrolleyTypesParams,
  FindAllTrolleyTypesResult,
  ITrolleyTypesRepository,
  UpdateTrolleyTypeData,
} from './trolley-type-repository.interface';

const NOT_DELETED: Prisma.TrolleyTypeWhereInput = { deletedAt: null };

@Injectable()
export class TrolleyTypeRepository implements ITrolleyTypesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllTrolleyTypesParams,
  ): Promise<FindAllTrolleyTypesResult> {
    const where: Prisma.TrolleyTypeWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.trolleyType.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.trolleyType.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.trolleyType.findFirst({
      where: { id, ...NOT_DELETED },
    });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.trolleyType.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  create(data: CreateTrolleyTypeData) {
    return this.prisma.trolleyType.create({ data });
  }

  update(id: string, data: UpdateTrolleyTypeData) {
    return this.prisma.trolleyType.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.trolleyType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
