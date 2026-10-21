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

// The table is an inspection buffer, not history: only the most recent
// reports are ever useful, and RCS pushes constantly. Capped by row count
// rather than by age, because the push rate — not the calendar — is what
// decides how fast it grows.
const MAX_ROWS = 500;
// Trimmed down to this, so there is room before the cap is approached again.
const TRIM_TO = 450;
// Trimming on every insert would mean a delete query per report. Checking
// every N keeps the cost negligible while still guaranteeing the cap:
// TRIM_TO + TRIM_EVERY (475) stays safely under MAX_ROWS.
const TRIM_EVERY = 25;

@Injectable()
export class AgvLogRepository implements IAgvLogsRepository {
  private insertsSinceTrim = 0;

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

    this.insertsSinceTrim += 1;
    if (this.insertsSinceTrim >= TRIM_EVERY) {
      this.insertsSinceTrim = 0;
      await this.trimToCap();
    }
  }

  /**
   * Deletes everything past the newest TRIM_TO rows.
   *
   * Raw SQL because this is one statement in the database rather than
   * reading ids back into Node first — the OFFSET does the selection, and
   * the createdAt index makes the ordering cheap.
   */
  private async trimToCap(): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        DELETE FROM "agv_logs"
        WHERE "id" IN (
          SELECT "id" FROM "agv_logs"
          ORDER BY "createdAt" DESC
          OFFSET ${TRIM_TO}
        )
      `;
    } catch {
      // Losing a trim is harmless — the next one catches up. Failing the
      // report that triggered it would not be.
    }
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
}
