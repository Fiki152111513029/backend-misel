import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateQuarantineLineData,
  FindAllQuarantineLinesParams,
  FindAllQuarantineLinesResult,
  IQuarantineLinesRepository,
  QuarantineLineWithRelations,
  UpdateQuarantineLineData,
} from './quarantine-line-repository.interface';

const NOT_DELETED: Prisma.QuarantineLineWhereInput = { deletedAt: null };
const RELATIONS_INCLUDE = {
  modelCodeProcess: {
    select: { id: true, name: true, fromSystem: true, isActive: true },
  },
} as const;

@Injectable()
export class QuarantineLineRepository implements IQuarantineLinesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllQuarantineLinesParams,
  ): Promise<FindAllQuarantineLinesResult> {
    const where: Prisma.QuarantineLineWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.quarantineLine.findMany({
        where,
        include: RELATIONS_INCLUDE,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.quarantineLine.count({ where }),
    ]);

    return { items: items as QuarantineLineWithRelations[], total };
  }

  findById(id: string) {
    return this.prisma.quarantineLine.findFirst({
      where: { id, ...NOT_DELETED },
      include: RELATIONS_INCLUDE,
    }) as Promise<QuarantineLineWithRelations | null>;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.quarantineLine.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
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

  async hasActiveAreas(id: string): Promise<boolean> {
    const count = await this.prisma.quarantineArea.count({
      where: { quarantineLineId: id, deletedAt: null },
    });
    return count > 0;
  }

  async hasActiveProductionLines(id: string): Promise<boolean> {
    const count = await this.prisma.productionLine.count({
      where: { quarantineLineId: id, deletedAt: null },
    });
    return count > 0;
  }

  create(data: CreateQuarantineLineData) {
    return this.prisma.quarantineLine.create({ data });
  }

  update(id: string, data: UpdateQuarantineLineData) {
    return this.prisma.quarantineLine.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.quarantineLine.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
