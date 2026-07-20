import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateBoxTypeData,
  FindAllBoxTypesParams,
  FindAllBoxTypesResult,
  IBoxTypesRepository,
  UpdateBoxTypeData,
} from './box-type-repository.interface';

const NOT_DELETED: Prisma.BoxTypeWhereInput = { deletedAt: null };

@Injectable()
export class BoxTypeRepository implements IBoxTypesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindAllBoxTypesParams): Promise<FindAllBoxTypesResult> {
    const where: Prisma.BoxTypeWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.boxType.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.boxType.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.boxType.findFirst({ where: { id, ...NOT_DELETED } });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.boxType.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsByOrdering(
    ordering: number,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.boxType.count({
      where: {
        ordering,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async hasActiveRequestBoxes(id: string): Promise<boolean> {
    const count = await this.prisma.requestBox.count({
      where: { boxTypeId: id, deletedAt: null },
    });
    return count > 0;
  }

  create(data: CreateBoxTypeData) {
    return this.prisma.boxType.create({ data });
  }

  update(id: string, data: UpdateBoxTypeData) {
    return this.prisma.boxType.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.boxType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
