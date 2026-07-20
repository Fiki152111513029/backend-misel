import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateProductionLineData,
  FindAllProductionLinesParams,
  FindAllProductionLinesResult,
  IProductionLinesRepository,
  ProductionLineWithRelations,
  UpdateProductionLineData,
} from './production-line-repository.interface';

const NOT_DELETED: Prisma.ProductionLineWhereInput = { deletedAt: null };
const RELATIONS_INCLUDE = {
  quarantineLine: { select: { id: true, name: true } },
  operator: { select: { id: true, username: true } },
} as const;

@Injectable()
export class ProductionLineRepository implements IProductionLinesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllProductionLinesParams,
  ): Promise<FindAllProductionLinesResult> {
    const where: Prisma.ProductionLineWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.productionLine.findMany({
        where,
        include: RELATIONS_INCLUDE,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.productionLine.count({ where }),
    ]);

    return { items: items, total };
  }

  findById(id: string) {
    return this.prisma.productionLine.findFirst({
      where: { id, ...NOT_DELETED },
      include: RELATIONS_INCLUDE,
    }) as Promise<ProductionLineWithRelations | null>;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.productionLine.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsActiveQuarantineLineById(
    quarantineLineId: string,
  ): Promise<boolean> {
    const count = await this.prisma.quarantineLine.count({
      where: { id: quarantineLineId, deletedAt: null },
    });
    return count > 0;
  }

  async existsActiveUserById(operatorId: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id: operatorId, isActive: true },
    });
    return count > 0;
  }

  async hasActiveAreas(id: string): Promise<boolean> {
    const count = await this.prisma.productionLineArea.count({
      where: { productionLineId: id, deletedAt: null },
    });
    return count > 0;
  }

  async hasActiveRequestBoxes(id: string): Promise<boolean> {
    const count = await this.prisma.requestBox.count({
      where: { productionLineId: id, deletedAt: null },
    });
    return count > 0;
  }

  create(data: CreateProductionLineData) {
    return this.prisma.productionLine.create({ data });
  }

  update(id: string, data: UpdateProductionLineData) {
    return this.prisma.productionLine.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.productionLine.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
