import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateShiftData,
  FindAllShiftsParams,
  FindAllShiftsResult,
  IShiftsRepository,
  UpdateShiftData,
} from './shift-repository.interface';

const NOT_DELETED: Prisma.ShiftWhereInput = { deletedAt: null };

@Injectable()
export class ShiftRepository implements IShiftsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindAllShiftsParams): Promise<FindAllShiftsResult> {
    const where: Prisma.ShiftWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.shift.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.shift.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.shift.findFirst({ where: { id, ...NOT_DELETED } });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.shift.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  create(data: CreateShiftData) {
    return this.prisma.shift.create({ data });
  }

  update(id: string, data: UpdateShiftData) {
    return this.prisma.shift.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.shift.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
