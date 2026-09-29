import { Injectable } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateCustomTaskRunData,
  FindAllCustomTaskRunsParams,
  FindAllCustomTaskRunsResult,
  ICustomTaskRunsRepository,
} from './custom-task-run-repository.interface';

const WITH_RELATIONS = {
  operator: { select: { id: true, fullName: true } },
  robot: { select: { id: true, name: true } },
} satisfies Prisma.CustomTaskRunInclude;

/**
 * YYYY-MM-DD as a local-time date — `new Date('2026-09-29')` parses as UTC
 * midnight, which lands on the previous day east of UTC.
 */
function parseLocalDateOnly(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

@Injectable()
export class CustomTaskRunRepository implements ICustomTaskRunsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateCustomTaskRunData) {
    return this.prisma.customTaskRun.create({ data });
  }

  findById(id: string) {
    return this.prisma.customTaskRun.findUnique({
      where: { id },
      include: { robot: { select: { amrDeviceSerialNo: true } } },
    });
  }

  cancel(id: string) {
    return this.prisma.customTaskRun.update({
      where: { id },
      data: { status: TaskStatus.FAILED, cancelledAt: new Date() },
      include: WITH_RELATIONS,
    });
  }

  async findAll(
    params: FindAllCustomTaskRunsParams,
  ): Promise<FindAllCustomTaskRunsResult> {
    let createdAt: Prisma.DateTimeFilter | undefined;
    if (params.date) {
      const since = parseLocalDateOnly(params.date);
      const until = new Date(since);
      until.setDate(until.getDate() + 1);
      createdAt = { gte: since, lt: until };
    }

    const where: Prisma.CustomTaskRunWhereInput = {
      ...(params.search
        ? {
            OR: [
              { code: { contains: params.search, mode: 'insensitive' } },
              { name: { contains: params.search, mode: 'insensitive' } },
              { orderId: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(createdAt ? { createdAt } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.customTaskRun.findMany({
        where,
        include: WITH_RELATIONS,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.customTaskRun.count({ where }),
    ]);

    return { items, total };
  }
}
