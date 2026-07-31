import { Injectable } from '@nestjs/common';
import { Prisma, TaskStatus, WarehouseCartTaskStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateWebhookLogData,
  FindAllWebhookLogsParams,
  FindAllWebhookLogsResult,
  IWebhookLogsRepository,
  WebhookLogRecord,
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

  async findLatestByOrderId(orderId: string): Promise<WebhookLogRecord | null> {
    return this.prisma.webhookLog.findFirst({
      where: {
        OR: [
          { requestPayload: { path: ['orderId'], equals: orderId } },
          { requestPayload: { path: ['ordeId'], equals: orderId } },
        ] as Prisma.WebhookLogWhereInput['OR'],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findModelProcessCodeNameByOrderId(
    orderId: string,
  ): Promise<string | null> {
    const task = await this.prisma.task.findFirst({
      where: { taskId: orderId, deletedAt: null },
      select: { boxType: { select: { modelProcessCode: true } } },
    });
    if (task) return task.boxType.modelProcessCode;

    const cartTask = await this.prisma.warehouseCartTask.findFirst({
      where: { taskId: orderId, deletedAt: null },
      select: { modelCodeProcess: { select: { name: true } } },
    });
    return cartTask?.modelCodeProcess.name ?? null;
  }

  async findStatusComment(
    modelProcessCodeName: string,
    subTaskSeq: number,
  ): Promise<string | null> {
    if (!Number.isInteger(subTaskSeq) || subTaskSeq < 1 || subTaskSeq > 8) {
      return null;
    }
    const modelCodeProcess = await this.prisma.modelCodeProcess.findFirst({
      where: { name: modelProcessCodeName, deletedAt: null },
      select: {
        statusComment1: true,
        statusComment2: true,
        statusComment3: true,
        statusComment4: true,
        statusComment5: true,
        statusComment6: true,
        statusComment7: true,
        statusComment8: true,
      },
    });
    if (!modelCodeProcess) return null;

    const key = `statusComment${subTaskSeq}` as keyof typeof modelCodeProcess;
    return modelCodeProcess[key] || null;
  }

  async findActiveTaskIdByRobotId(robotId: string): Promise<string | null> {
    const ACTIVE_TASK_STATUSES: TaskStatus[] = [
      TaskStatus.PENDING,
      TaskStatus.IN_PROGRESS,
    ];
    const ACTIVE_CART_TASK_STATUSES: WarehouseCartTaskStatus[] = [
      WarehouseCartTaskStatus.PENDING,
      WarehouseCartTaskStatus.IN_PROGRESS,
    ];

    const [task, cartTask] = await Promise.all([
      this.prisma.task.findFirst({
        where: { robotId, status: { in: ACTIVE_TASK_STATUSES }, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        select: { taskId: true, updatedAt: true },
      }),
      this.prisma.warehouseCartTask.findFirst({
        where: {
          robotId,
          status: { in: ACTIVE_CART_TASK_STATUSES },
          deletedAt: null,
        },
        orderBy: { updatedAt: 'desc' },
        select: { taskId: true, updatedAt: true },
      }),
    ]);

    if (task && cartTask) {
      return task.updatedAt > cartTask.updatedAt ? task.taskId : cartTask.taskId;
    }
    return task?.taskId ?? cartTask?.taskId ?? null;
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
