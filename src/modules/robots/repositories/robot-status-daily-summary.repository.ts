import { Injectable } from '@nestjs/common';
import { RobotShift } from '@prisma/client';
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
    shift: RobotShift,
    minutes: RobotStatusDailyMinutes,
  ): Promise<void> {
    await this.prisma.robotStatusDailySummary.upsert({
      where: { robotId_date_shift: { robotId, date, shift } },
      create: { robotId, date, shift, ...minutes },
      update: { ...minutes },
    });
  }

  findAllByDate(
    date: Date,
    shift: RobotShift,
  ): Promise<RobotStatusDailySummaryRecord[]> {
    return this.prisma.robotStatusDailySummary.findMany({
      where: { date, shift },
      select: SELECT_FIELDS,
    });
  }

  findRangeByRobot(
    robotId: string,
    shift: RobotShift,
    from: Date,
    to: Date,
  ): Promise<RobotStatusDailySummaryRecord[]> {
    return this.prisma.robotStatusDailySummary.findMany({
      where: { robotId, shift, date: { gte: from, lt: to } },
      select: SELECT_FIELDS,
      orderBy: { date: 'asc' },
    });
  }
}
