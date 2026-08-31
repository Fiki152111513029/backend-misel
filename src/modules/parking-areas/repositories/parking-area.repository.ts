import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateParkingAreaData,
  FindAllParkingAreasParams,
  FindAllParkingAreasResult,
  IParkingAreasRepository,
  UpdateParkingAreaData,
} from './parking-area-repository.interface';

const NOT_DELETED: Prisma.ParkingAreaWhereInput = { deletedAt: null };

@Injectable()
export class ParkingAreaRepository implements IParkingAreasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllParkingAreasParams,
  ): Promise<FindAllParkingAreasResult> {
    const where: Prisma.ParkingAreaWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.parkingArea.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.parkingArea.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.parkingArea.findFirst({ where: { id, ...NOT_DELETED } });
  }

  async findAllActiveCodes(): Promise<string[]> {
    const rows = await this.prisma.parkingArea.findMany({
      where: NOT_DELETED,
      select: { iRaypleLocationCode: true },
    });
    return rows.map((row) => row.iRaypleLocationCode);
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.parkingArea.count({
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
    const count = await this.prisma.parkingArea.count({
      where: {
        iRaypleLocationCode: code,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  create(data: CreateParkingAreaData) {
    return this.prisma.parkingArea.create({ data });
  }

  update(id: string, data: UpdateParkingAreaData) {
    return this.prisma.parkingArea.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.parkingArea.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
