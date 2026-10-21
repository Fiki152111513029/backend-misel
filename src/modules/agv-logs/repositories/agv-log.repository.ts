import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateAgvLogData,
  FindAllAgvLogsParams,
  FindAllAgvLogsResult,
  IAgvLogsRepository,
} from './agv-log-repository.interface';

/**
 * YYYY-MM-DD as a local-time date — `new Date('2026-10-21')` parses as UTC
 * midnight, which lands on the previous day east of UTC.
 */
function parseLocalDateOnly(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

@Injectable()
export class AgvLogRepository implements IAgvLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(data: CreateAgvLogData): Promise<void> {
    await this.prisma.agvLog.create({
      data: {
        method: data.method,
        endpoint: data.endpoint,
        deviceCode: data.deviceCode,
        requestPayload: data.requestPayload as Prisma.InputJsonValue,
        responsePayload: data.responsePayload as Prisma.InputJsonValue,
      },
    });
  }

  async findAll(
    params: FindAllAgvLogsParams,
  ): Promise<FindAllAgvLogsResult> {
    const where: Prisma.AgvLogWhereInput = {};
    if (params.deviceCode) where.deviceCode = params.deviceCode;
    if (params.date) {
      const start = parseLocalDateOnly(params.date);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.createdAt = { gte: start, lt: end };
    }

    const [items, total] = await Promise.all([
      this.prisma.agvLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.agvLog.count({ where }),
    ]);

    return { items, total };
  }

  async findDeviceCodes(): Promise<string[]> {
    const rows = await this.prisma.agvLog.findMany({
      where: { deviceCode: { not: null } },
      distinct: ['deviceCode'],
      select: { deviceCode: true },
      orderBy: { deviceCode: 'asc' },
    });
    return rows
      .map((row) => row.deviceCode)
      .filter((code): code is string => code != null);
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const { count } = await this.prisma.agvLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return count;
  }
}
