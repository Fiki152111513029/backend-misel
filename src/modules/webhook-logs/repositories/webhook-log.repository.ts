import { Injectable } from '@nestjs/common';
import { TaskStatus, WarehouseCartTaskStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateWebhookLogData,
  FindAllWebhookLogsParams,
  FindAllWebhookLogsResult,
  IWebhookLogsRepository,
} from './webhook-log-repository.interface';

@Injectable()
export class WebhookLogRepository implements IWebhookLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(data: CreateWebhookLogData): Promise<void> {
    await this.prisma.webhookLog.create({
      data: {
        method: data.method,
        endpoint: data.endpoint,
        requestPayload: data.requestPayload as never,
        responsePayload: data.responsePayload as never,
      },
    });
  }

  async findAll(
    params: FindAllWebhookLogsParams,
  ): Promise<FindAllWebhookLogsResult> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.webhookLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.webhookLog.count(),
    ]);
    return { items, total };
  }

  async findRobotIdByDeviceCode(deviceCode: string): Promise<string | null> {
    const robot = await this.prisma.robot.findFirst({
      where: {
        deletedAt: null,
        OR: [{ amrDeviceNo: deviceCode }, { amrDeviceSerialNo: deviceCode }],
      },
      select: { id: true },
    });
    return robot?.id ?? null;
  }

  async updateTaskStatusByTaskId(
    taskId: string,
    status: TaskStatus,
    robotId?: string,
  ): Promise<boolean> {
    const result = await this.prisma.task.updateMany({
      where: { taskId, deletedAt: null },
      data: { status, ...(robotId ? { robotId } : {}) },
    });
    return result.count > 0;
  }

  async updateWarehouseCartTaskStatusByTaskId(
    taskId: string,
    status: WarehouseCartTaskStatus,
    robotId?: string,
  ): Promise<boolean> {
    const result = await this.prisma.warehouseCartTask.updateMany({
      where: { taskId, deletedAt: null },
      data: { status, ...(robotId ? { robotId } : {}) },
    });
    return result.count > 0;
  }
}
