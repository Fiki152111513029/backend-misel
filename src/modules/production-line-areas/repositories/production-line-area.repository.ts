import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateProductionLineAreaData,
  FindAllProductionLineAreasParams,
  FindAllProductionLineAreasResult,
  IProductionLineAreasRepository,
  ProductionLineAreaWithRelations,
  UpdateProductionLineAreaData,
} from './production-line-area-repository.interface';

const NOT_DELETED: Prisma.ProductionLineAreaWhereInput = { deletedAt: null };
const RELATIONS_INCLUDE = {
  productionLine: { select: { id: true, name: true } },
  eximLocation: { select: { id: true, name: true } },
  emptyPalletLocation: { select: { id: true, name: true } },
  modelCodeProcess: { select: { id: true, name: true } },
} as const;

@Injectable()
export class ProductionLineAreaRepository implements IProductionLineAreasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllProductionLineAreasParams,
  ): Promise<FindAllProductionLineAreasResult> {
    const where: Prisma.ProductionLineAreaWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.productionLineArea.findMany({
        where,
        include: RELATIONS_INCLUDE,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.productionLineArea.count({ where }),
    ]);

    return { items: items, total };
  }

  findById(id: string) {
    return this.prisma.productionLineArea.findFirst({
      where: { id, ...NOT_DELETED },
      include: RELATIONS_INCLUDE,
    }) as Promise<ProductionLineAreaWithRelations | null>;
  }

  async existsByLocationCode(
    code: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.productionLineArea.count({
      where: {
        iRaypleLocationCode: code,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsActiveProductionLineById(
    productionLineId: string,
  ): Promise<boolean> {
    const count = await this.prisma.productionLine.count({
      where: { id: productionLineId, deletedAt: null },
    });
    return count > 0;
  }

  async existsActiveEximLocationById(eximLocationId: string): Promise<boolean> {
    const count = await this.prisma.eximLocation.count({
      where: { id: eximLocationId, deletedAt: null },
    });
    return count > 0;
  }

  async existsActiveEmptyPalletLocationById(
    emptyPalletLocationId: string,
  ): Promise<boolean> {
    const count = await this.prisma.emptyPalletLocation.count({
      where: { id: emptyPalletLocationId, deletedAt: null },
    });
    return count > 0;
  }

  async existsActiveModelCodeProcessById(
    modelCodeProcessId: string,
  ): Promise<boolean> {
    const count = await this.prisma.modelCodeProcess.count({
      where: { id: modelCodeProcessId, deletedAt: null, isActive: true },
    });
    return count > 0;
  }

  create(data: CreateProductionLineAreaData) {
    return this.prisma.productionLineArea.create({ data });
  }

  update(id: string, data: UpdateProductionLineAreaData) {
    return this.prisma.productionLineArea.update({ where: { id }, data });
  }

  async reorderMany(items: { id: string; order: number }[]): Promise<void> {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.productionLineArea.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.productionLineArea.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
