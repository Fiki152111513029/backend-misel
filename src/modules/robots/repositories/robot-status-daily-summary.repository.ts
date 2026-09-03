import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IRobotStatusDailySummaryRepository,
  RobotStatusDailyMinutes,
  RobotStatusDailySummaryRecord,
} from './robot-status-daily-summary-repository.interface';

const SELECT_FIELDS = {
  robotId: true,
  date: true,
  runningMinutes: true,
  idleMinutes: true,
  chargingMinutes: true,
} as const;

@Injectable()
export class RobotStatusDailySummaryRepository implements IRobotStatusDailySummaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    robotId: string,
    date: Date,
    shiftId: string,
    minutes: RobotStatusDailyMinutes,
  ): Promise<void> {
    await this.prisma.robotStatusDailySummary.upsert({
      where: { robotId_date_shiftId: { robotId, date, shiftId } },
      create: { robotId, date, shiftId, ...minutes },
      update: { ...minutes },
    });
  }

  findAllByDate(
    date: Date,
    shiftId: string,
  ): Promise<RobotStatusDailySummaryRecord[]> {
    return this.prisma.robotStatusDailySummary.findMany({
      where: { date, shiftId },
      select: SELECT_FIELDS,
    });
  }

  findRangeByRobot(
    robotId: string,
    shiftId: string,
    from: Date,
    to: Date,
  ): Promise<RobotStatusDailySummaryRecord[]> {
    return this.prisma.robotStatusDailySummary.findMany({
      where: { robotId, shiftId, date: { gte: from, lt: to } },
      select: SELECT_FIELDS,
      orderBy: { date: 'asc' },
    });
  }
}
