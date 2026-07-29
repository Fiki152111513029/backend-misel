import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateRobotActivityLogData,
  FindRobotActivityParams,
  FindRobotActivityResult,
  IRobotActivityLogRepository,
} from './robot-activity-log-repository.interface';

@Injectable()
export class RobotActivityLogRepository implements IRobotActivityLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(data: CreateRobotActivityLogData): Promise<void> {
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
}
