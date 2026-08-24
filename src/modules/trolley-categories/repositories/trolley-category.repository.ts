import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateTrolleyCategoryData,
  FindAllTrolleyCategoriesParams,
  FindAllTrolleyCategoriesResult,
  ITrolleyCategoriesRepository,
  UpdateTrolleyCategoryData,
} from './trolley-category-repository.interface';

const NOT_DELETED: Prisma.TrolleyCategoryWhereInput = { deletedAt: null };
const RELATIONS_INCLUDE = {
  modelCodeProcess: { select: { id: true, name: true, fromSystem: true } },
} as const;

@Injectable()
export class TrolleyCategoryRepository implements ITrolleyCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllTrolleyCategoriesParams,
  ): Promise<FindAllTrolleyCategoriesResult> {
    const where: Prisma.TrolleyCategoryWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.trolleyCategory.findMany({
        where,
        include: RELATIONS_INCLUDE,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.trolleyCategory.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.trolleyCategory.findFirst({
      where: { id, ...NOT_DELETED },
      include: RELATIONS_INCLUDE,
    });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.trolleyCategory.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsActiveModelCodeProcessById(id: string): Promise<boolean> {
    const count = await this.prisma.modelCodeProcess.count({
      where: { id, deletedAt: null, isActive: true },
    });
    return count > 0;
  }

  create(data: CreateTrolleyCategoryData) {
    return this.prisma.trolleyCategory.create({ data, include: RELATIONS_INCLUDE });
  }

  update(id: string, data: UpdateTrolleyCategoryData) {
    return this.prisma.trolleyCategory.update({
      where: { id },
      data,
      include: RELATIONS_INCLUDE,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.trolleyCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
