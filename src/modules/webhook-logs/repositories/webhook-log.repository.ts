import { Injectable } from '@nestjs/common';
import { Prisma, TaskStatus, WarehouseCartTaskStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateWebhookLogData,
  FindAllWebhookLogsParams,
  FindAllWebhookLogsResult,
  IWebhookLogsRepository,
  TaskStatusSummary,
  WebhookLogRecord,
} from './webhook-log-repository.interface';

// RCS's own order-status codes, read off the task-status webhook payload's
// `status` field. The full code list (and its labels) lives in
// Frontend/app/utils/taskStatus.ts; this folds it into the five buckets the
// Dashboard's Performance card shows:
//
//   notStarted — accepted but not executing yet (not sent, sending,
//                assigned, waiting to be acknowledged)
//   inProgress — actively being worked, including the pick/place steps and
//                a cancel that is still going through
//   completed  — 8, the only success code
//   failed     — 5 (sending failed) and 7 (execution failed)
//   cancelled  — 3, cancelled outright
//
// Anything not listed here (a code RCS adds later, or a payload with no
// `status` at all) lands in `unknown` rather than being guessed at.
const RCS_STATUS_BUCKET: Record<string, keyof TaskStatusSummary> = {
  '1': 'notStarted', // Not sent
  '4': 'notStarted', // Sending
  '9': 'notStarted', // Assigned
  '10': 'notStarted', // Wait for acknowledgment
  '2': 'inProgress', // Canceling — still in flight, not cancelled yet
  '6': 'inProgress', // Running
  '20': 'inProgress', // Picking
  '21': 'inProgress', // Picked
  '22': 'inProgress', // Placing
  '23': 'inProgress', // Placed
  '8': 'completed', // Completed
  '5': 'failed', // Sending failed
  '7': 'failed', // Execution failed
  '3': 'cancelled', // Canceled
};

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

  async getTaskStatusSummary(
    since: Date,
    until: Date,
    areaId?: number,
  ): Promise<TaskStatusSummary> {
    const rows = await this.prisma.webhookLog.findMany({
      where: {
        endpoint: '/webhooks-logs',
        createdAt: { gte: since, lt: until },
      },
      orderBy: { createdAt: 'asc' },
      select: { requestPayload: true },
    });

    // An order belongs to an area through the robot that ran it: the
    // payload carries `deviceCode`, which is a Robot.amrDeviceSerialNo.
    // Orders whose deviceCode matches no robot in the area — including
    // orders that carry no deviceCode at all — can't be attributed to it,
    // so they are left out rather than counted everywhere.
    const serialsInArea =
      areaId == null
        ? null
        : new Set(
            (
              await this.prisma.robot.findMany({
                where: { areaId, deletedAt: null },
                select: { amrDeviceSerialNo: true },
              })
            ).map((robot) => robot.amrDeviceSerialNo),
          );

    // Ascending order means the last write per order wins — that order's
    // most recently reported status. RCS spells the id "ordeId" in one
    // place (see docs/apiwebhook.md), so both spellings are accepted.
    const latestStatusByOrder = new Map<string, string | null>();
    for (const row of rows) {
      const payload = (row.requestPayload ?? {}) as Record<string, unknown>;
      const orderId = this.readPayloadString(payload, ['orderId', 'ordeId']);
      if (!orderId) continue;
      if (serialsInArea) {
        const deviceCode = this.readPayloadString(payload, ['deviceCode']);
        if (!deviceCode || !serialsInArea.has(deviceCode)) {
          // A later call for this order could still place it in the area,
          // so only drop what we have so far rather than the whole order.
          latestStatusByOrder.delete(orderId);
          continue;
        }
      }
      latestStatusByOrder.set(
        orderId,
        this.readPayloadString(payload, ['status']),
      );
    }

    const summary: TaskStatusSummary = {
      notStarted: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      total: 0,
      unknown: 0,
    };
    for (const status of latestStatusByOrder.values()) {
      const bucket = status ? RCS_STATUS_BUCKET[status] : undefined;
      if (!bucket) {
        summary.unknown += 1;
        continue;
      }
      summary[bucket] += 1;
      summary.total += 1;
    }
    return summary;
  }

  private readPayloadString(
    payload: Record<string, unknown>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number') return String(value);
    }
    return null;
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const result = await this.prisma.webhookLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return result.count;
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
    if (cartTask) return cartTask.modelCodeProcess.name;

    const trolleyActivity = await this.prisma.trolleyActivity.findFirst({
      where: { taskId: orderId, deletedAt: null },
      select: {
        trolley: { select: { modelCodeProcess: { select: { name: true } } } },
      },
    });
    return trolleyActivity?.trolley.modelCodeProcess?.name ?? null;
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

    // Mirrors findModelProcessCodeNameByOrderId below, which already falls
    // back to TrolleyActivity — a robot currently running a Warehouse/
    // Operator Trolley Task has its active order tracked there, not in
    // Task/WarehouseCartTask, so leaving it out here meant Mission never
    // resolved (always null) for that entire class of task.
    const ACTIVE_TROLLEY_ACTIVITY_STATUSES: TaskStatus[] = [
      TaskStatus.PENDING,
      TaskStatus.IN_PROGRESS,
    ];

    const [task, cartTask, trolleyActivity] = await Promise.all([
      this.prisma.task.findFirst({
        where: {
          robotId,
          status: { in: ACTIVE_TASK_STATUSES },
          deletedAt: null,
        },
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
      this.prisma.trolleyActivity.findFirst({
        where: {
          robotId,
          status: { in: ACTIVE_TROLLEY_ACTIVITY_STATUSES },
          deletedAt: null,
        },
        orderBy: { updatedAt: 'desc' },
        select: { taskId: true, updatedAt: true },
      }),
    ]);

    const candidates = [task, cartTask, trolleyActivity].filter(
      (candidate): candidate is { taskId: string; updatedAt: Date } =>
        candidate !== null,
    );
    if (candidates.length === 0) return null;
    return candidates.reduce((latest, candidate) =>
      candidate.updatedAt > latest.updatedAt ? candidate : latest,
    ).taskId;
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

  async updateCustomTaskRunStatusByTaskId(
    taskId: string,
    status: TaskStatus,
    robotId?: string,
  ): Promise<boolean> {
    const result = await this.prisma.customTaskRun.updateMany({
      where: { orderId: taskId },
      data: { status, ...(robotId ? { robotId } : {}) },
    });
    return result.count > 0;
  }

  async updateTrolleyActivityStatusByTaskId(
    taskId: string,
    status: TaskStatus,
    robotId?: string,
  ): Promise<boolean> {
    const result = await this.prisma.trolleyActivity.updateMany({
      where: { taskId, deletedAt: null },
      data: { status, ...(robotId ? { robotId } : {}) },
    });
    return result.count > 0;
  }

  async setTrolleyActivityDroppingLocation(
    taskId: string,
    droppingLocationCode: string,
  ): Promise<void> {
    const activity = await this.prisma.trolleyActivity.findFirst({
      where: { taskId, deletedAt: null, droppingLocationCode: null },
      select: {
        id: true,
        trolleyId: true,
        trolley: { select: { currentLocationCode: true } },
      },
    });
    if (!activity) return;

    // The submit-time guess (first EMPTY Warehouse Location — see
    // CreateTrolleyActivityUseCase) may not be where RCS actually dropped
    // the trolley. Correct its occupancy back to EMPTY if it turns out to
    // have been wrong, and mark the real destination FULL instead.
    const guessedCode = activity.trolley.currentLocationCode;

    await this.prisma.$transaction(async (tx) => {
      await tx.trolleyActivity.update({
        where: { id: activity.id },
        data: { droppingLocationCode },
      });
      await tx.trolley.update({
        where: { id: activity.trolleyId },
        data: { currentLocationCode: droppingLocationCode },
      });
      if (guessedCode && guessedCode !== droppingLocationCode) {
        await tx.warehouseLocation.updateMany({
          where: { iRaypleLocationCode: guessedCode, deletedAt: null },
          data: { status: 'EMPTY' },
        });
      }
      await tx.warehouseLocation.updateMany({
        where: { iRaypleLocationCode: droppingLocationCode, deletedAt: null },
        data: { status: 'FULL' },
      });
    });
  }
}
