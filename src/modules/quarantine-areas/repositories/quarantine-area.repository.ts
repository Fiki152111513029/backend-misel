import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateQuarantineAreaData,
  FindAllQuarantineAreasParams,
  FindAllQuarantineAreasResult,
  IQuarantineAreasRepository,
  UpdateQuarantineAreaData,
} from './quarantine-area-repository.interface';

const NOT_DELETED: Prisma.QuarantineAreaWhereInput = { deletedAt: null };
const LINE_INCLUDE = { quarantineLine: true } as const;

@Injectable()
export class QuarantineAreaRepository implements IQuarantineAreasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllQuarantineAreasParams,
  ): Promise<FindAllQuarantineAreasResult> {
    const where: Prisma.QuarantineAreaWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.quarantineArea.findMany({
        where,
        include: LINE_INCLUDE,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.quarantineArea.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.quarantineArea.findFirst({
      where: { id, ...NOT_DELETED },
      include: LINE_INCLUDE,
    });
  }

  async existsByLocationCode(
    code: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.quarantineArea.count({
      where: {
        iRaypleLocationCode: code,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsActiveLineById(quarantineLineId: string): Promise<boolean> {
    const count = await this.prisma.quarantineLine.count({
      where: { id: quarantineLineId, deletedAt: null },
    });
    return count > 0;
  }

  create(data: CreateQuarantineAreaData) {
    return this.prisma.quarantineArea.create({ data });
  }

  update(id: string, data: UpdateQuarantineAreaData) {
    return this.prisma.quarantineArea.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.quarantineArea.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
