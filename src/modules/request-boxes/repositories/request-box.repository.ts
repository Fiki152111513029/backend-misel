import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateRequestBoxData,
  FindAllRequestBoxesParams,
  FindAllRequestBoxesResult,
  IRequestBoxesRepository,
} from './request-box-repository.interface';

const NOT_DELETED: Prisma.RequestBoxWhereInput = { deletedAt: null };
const RELATIONS_INCLUDE = {
  productionLine: { select: { id: true, name: true } },
  boxType: { select: { id: true, name: true, colorCode: true } },
} as const;

@Injectable()
export class RequestBoxRepository implements IRequestBoxesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllRequestBoxesParams,
  ): Promise<FindAllRequestBoxesResult> {
    const where: Prisma.RequestBoxWhereInput = { ...NOT_DELETED };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.requestBox.findMany({
        where,
        include: RELATIONS_INCLUDE,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.requestBox.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.requestBox.findFirst({
      where: { id, ...NOT_DELETED },
      include: RELATIONS_INCLUDE,
    });
  }

  async existsActiveBoxTypeById(boxTypeId: string): Promise<boolean> {
    const count = await this.prisma.boxType.count({
      where: { id: boxTypeId, deletedAt: null },
    });
    return count > 0;
  }

  async findProductionLineOperatorId(
    productionLineId: string,
  ): Promise<string | null> {
    const line = await this.prisma.productionLine.findFirst({
      where: { id: productionLineId, deletedAt: null },
      select: { operatorId: true },
    });
    return line?.operatorId ?? null;
  }

  create(data: CreateRequestBoxData) {
    return this.prisma.requestBox.create({ data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.requestBox.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
