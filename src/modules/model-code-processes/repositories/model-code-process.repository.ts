import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateModelCodeProcessData,
  FindAllModelCodeProcessesParams,
  FindAllModelCodeProcessesResult,
  IModelCodeProcessesRepository,
  UpdateModelCodeProcessData,
} from './model-code-process-repository.interface';

const NOT_DELETED: Prisma.ModelCodeProcessWhereInput = { deletedAt: null };

@Injectable()
export class ModelCodeProcessRepository
  implements IModelCodeProcessesRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllModelCodeProcessesParams,
  ): Promise<FindAllModelCodeProcessesResult> {
    const where: Prisma.ModelCodeProcessWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.modelCodeProcess.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.modelCodeProcess.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.modelCodeProcess.findFirst({
      where: { id, ...NOT_DELETED },
    });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.modelCodeProcess.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  create(data: CreateModelCodeProcessData) {
    return this.prisma.modelCodeProcess.create({ data });
  }

  update(id: string, data: UpdateModelCodeProcessData) {
    return this.prisma.modelCodeProcess.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.modelCodeProcess.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
