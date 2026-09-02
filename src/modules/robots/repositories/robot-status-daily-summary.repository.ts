import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IRobotStatusDailySummaryRepository,
  RobotStatusDailyMinutes,
  RobotStatusDailySummaryRecord,
} from './robot-status-daily-summary-repository.interface';

@Injectable()
export class RobotStatusDailySummaryRepository implements IRobotStatusDailySummaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    robotId: string,
    date: Date,
    minutes: RobotStatusDailyMinutes,
  ): Promise<void> {
    await this.prisma.robotStatusDailySummary.upsert({
      where: { robotId_date: { robotId, date } },
      create: { robotId, date, ...minutes },
      update: { ...minutes },
    });
  }

  findByRobotAndDate(
    robotId: string,
    date: Date,
  ): Promise<RobotStatusDailySummaryRecord | null> {
    return this.prisma.robotStatusDailySummary.findUnique({
      where: { robotId_date: { robotId, date } },
      select: {
        robotId: true,
        date: true,
        runningMinutes: true,
        idleMinutes: true,
        chargingMinutes: true,
      },
    });
  }

  findAllByDate(date: Date): Promise<RobotStatusDailySummaryRecord[]> {
    return this.prisma.robotStatusDailySummary.findMany({
      where: { date },
      select: {
        robotId: true,
        date: true,
        runningMinutes: true,
        idleMinutes: true,
        chargingMinutes: true,
      },
    });
  }
}
