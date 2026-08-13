import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateTrolleyData,
  FindAllTrolleysParams,
  FindAllTrolleysResult,
  ITrolleysRepository,
  UpdateTrolleyData,
} from './trolley-repository.interface';

const NOT_DELETED: Prisma.TrolleyWhereInput = { deletedAt: null };

@Injectable()
export class TrolleyRepository implements ITrolleysRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindAllTrolleysParams): Promise<FindAllTrolleysResult> {
    const where: Prisma.TrolleyWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.trolley.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.trolley.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.trolley.findFirst({ where: { id, ...NOT_DELETED } });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.trolley.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.trolley.count({
      where: {
        code,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  create(data: CreateTrolleyData) {
    return this.prisma.trolley.create({ data });
  }

  update(id: string, data: UpdateTrolleyData) {
    return this.prisma.trolley.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.trolley.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
