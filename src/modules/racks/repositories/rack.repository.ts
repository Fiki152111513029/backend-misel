import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateRackData,
  FindAllRacksParams,
  FindAllRacksResult,
  IRacksRepository,
  UpdateRackData,
} from './rack-repository.interface';

const NOT_DELETED: Prisma.RackWhereInput = { deletedAt: null };

@Injectable()
export class RackRepository implements IRacksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindAllRacksParams): Promise<FindAllRacksResult> {
    const where: Prisma.RackWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.rack.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.rack.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.rack.findFirst({ where: { id, ...NOT_DELETED } });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.rack.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  create(data: CreateRackData) {
    return this.prisma.rack.create({ data });
  }

  update(id: string, data: UpdateRackData) {
    return this.prisma.rack.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.rack.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
