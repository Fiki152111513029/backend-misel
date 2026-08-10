import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateChargerAreaData,
  FindAllChargerAreasParams,
  FindAllChargerAreasResult,
  IChargerAreasRepository,
  UpdateChargerAreaData,
} from './charger-area-repository.interface';

const NOT_DELETED: Prisma.ChargerAreaWhereInput = { deletedAt: null };

@Injectable()
export class ChargerAreaRepository implements IChargerAreasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllChargerAreasParams,
  ): Promise<FindAllChargerAreasResult> {
    const where: Prisma.ChargerAreaWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.chargerArea.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.chargerArea.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.chargerArea.findFirst({ where: { id, ...NOT_DELETED } });
  }

  async findAllActiveCodes(): Promise<string[]> {
    const rows = await this.prisma.chargerArea.findMany({
      where: NOT_DELETED,
      select: { iRaypleLocationCode: true },
    });
    return rows.map((row) => row.iRaypleLocationCode);
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.chargerArea.count({
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
    const count = await this.prisma.chargerArea.count({
      where: {
        iRaypleLocationCode: code,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  create(data: CreateChargerAreaData) {
    return this.prisma.chargerArea.create({ data });
  }

  update(id: string, data: UpdateChargerAreaData) {
    return this.prisma.chargerArea.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.chargerArea.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
