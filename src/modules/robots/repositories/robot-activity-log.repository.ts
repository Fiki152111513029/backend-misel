import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateRobotActivityLogData,
  FindRobotActivityParams,
  FindRobotActivityResult,
  IRobotActivityLogRepository,
} from './robot-activity-log-repository.interface';

// Below this, an unchanged reading isn't worth its own row — Factory Map
// alone polls every 1s per robot, which would otherwise write a near-
// identical row 900+ times over 15 minutes for a robot just sitting Idle.
const UNCHANGED_THROTTLE_MS = 15_000;

@Injectable()
export class RobotActivityLogRepository implements IRobotActivityLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(data: CreateRobotActivityLogData): Promise<void> {
    const last = await this.prisma.robotActivityLog.findFirst({
      where: { robotId: data.robotId },
      orderBy: { recordedAt: 'desc' },
    });

    if (last) {
      const elapsedMs = Date.now() - last.recordedAt.getTime();
      const unchanged =
        last.state === data.state &&
        last.battery === data.battery &&
        last.status === data.status &&
        last.position === data.position &&
        last.payload === data.payload &&
        last.speed === data.speed &&
        last.orientation === data.orientation;
      if (elapsedMs < UNCHANGED_THROTTLE_MS && unchanged) {
        return;
      }
    }

    await this.prisma.robotActivityLog.create({ data });
  }

  async findByRobot(
    params: FindRobotActivityParams,
  ): Promise<FindRobotActivityResult> {
    const where: Prisma.RobotActivityLogWhereInput = {
      robotId: params.robotId,
      ...(params.startDate || params.endDate
        ? {
            recordedAt: {
              ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
              ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.robotActivityLog.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.robotActivityLog.count({ where }),
    ]);
    return { items, total };
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const result = await this.prisma.robotActivityLog.deleteMany({
      where: { recordedAt: { lt: cutoff } },
    });
    return result.count;
  }
}
