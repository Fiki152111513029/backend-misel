import { Inject, Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { WEBHOOK_LOGS_REPOSITORY } from '../repositories/webhook-log-repository.interface';
import type { IWebhookLogsRepository } from '../repositories/webhook-log-repository.interface';
import { TaskOrderService } from '../../tasks/services/task-order.service';
import { RealtimeService } from '../../realtime/realtime.service';
import {
  NODE_STATUS_EMPTY,
  NODE_STATUS_FULL,
  RcsStockStatusService,
} from '../../rcs-stock-status/rcs-stock-status.service';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';

// RCS's own OrderStatus codes (see docs/apiwebhook.md and the Mainline
// status mapping) — 8 is the only success code, 3/5/7 are terminal
// failures, everything else (6/9/10/20/21/22/23, or anything we don't
// recognize yet) is treated as still in progress.
const RCS_COMPLETED_CODE = '8';
const RCS_FAILED_CODES = ['3', '5', '7'];

// 21 = Picked: the moment the rack leaves the node it was collected from.
// Not 20 (Picking, still lifting) and not 22/23, which are about putting
// it down somewhere else.
const RCS_PICKED_CODE = '21';

// 23 = Placed: the rack is down at its destination. The counterpart of
// Picked — one empties the node it left, the other fills the one it reached.
const RCS_PLACED_CODE = '23';

function normalizeStatus(rawStatus: string): TaskStatus {
  if (rawStatus === TaskStatus.COMPLETED || rawStatus === RCS_COMPLETED_CODE) {
    return TaskStatus.COMPLETED;
  }
  if (rawStatus === TaskStatus.FAILED || RCS_FAILED_CODES.includes(rawStatus)) {
    return TaskStatus.FAILED;
  }
  if (rawStatus === TaskStatus.PENDING) {
    return TaskStatus.PENDING;
  }
  return TaskStatus.IN_PROGRESS;
}

@Injectable()
export class ReceiveTaskStatusWebhookUseCase {
  constructor(
    @Inject(WEBHOOK_LOGS_REPOSITORY)
    private readonly webhookLogsRepository: IWebhookLogsRepository,
    private readonly taskOrderService: TaskOrderService,
    private readonly realtime: RealtimeService,
    private readonly rcsStockStatusService: RcsStockStatusService,
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
  ) {}

  /**
   * Marks a Custom Task's pickup node empty once the AGV has lifted its
   * rack off it.
   *
   * RCS does not clear the node by itself, so without this the slot stays
   * recorded as full long after the rack has gone — which then blocks the
   * next task that wants to drop there, and makes Checking Area disagree
   * with the floor.
   *
   * Only the first leg, and only when it is a Warehouse Location: those
   * are the nodes whose occupancy is tracked at all.
   */
  /** Active Warehouse Location codes — which nodes are tracked at all. */
  private async warehouseCodes(): Promise<Set<string>> {
    const { items } = await this.warehouseLocationsRepository.findAll({
      page: 1,
      limit: 1000,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    return new Set(
      items
        .filter((location) => location.isActive && !location.deletedAt)
        .map((location) => location.iRaypleLocationCode),
    );
  }

  /**
   * Tells the warehouse an AMR is on its way, and what for.
   *
   * Sent from here rather than at dispatch because this is the first point
   * the robot is known — RCS assigns one itself, after accepting the order.
   * It fires on every update for the task; the page ignores repeats of a
   * notice it has already shown, which keeps any "already told them" state
   * out of the database.
   */
  private async notifyWarehouseRunning(orderId: string): Promise<void> {
    const context =
      await this.webhookLogsRepository.findCustomTaskRunNoticeContext(orderId);
    if (!context?.robotName) return;

    const route = context.taskPath.split(',').map((leg) => leg.trim());
    const pickup = route[0];
    const drop = route[route.length - 1];
    const codes = await this.warehouseCodes();

    // Collecting from the warehouse is the more urgent errand, so it wins
    // when a route both starts and ends there.
    const kind = codes.has(pickup)
      ? ('pickup-running' as const)
      : codes.has(drop)
        ? ('drop-running' as const)
        : null;
    if (!kind) return;

    this.realtime.publishWarehouseNotice({
      kind,
      requester: context.requester,
      nodeCode: kind === 'pickup-running' ? pickup : drop,
      robotName: context.robotName,
      orderId,
    });
  }

  /**
   * Marks a Custom Task's drop node full once the AMR has set its rack
   * down there, and tells the warehouse the goods have arrived.
   *
   * The mirror of clearPickupNode. Without it RCS keeps the slot recorded
   * as free, which then lets the next task be dispatched into a node that
   * is physically occupied — and nobody in the warehouse is told there is
   * something waiting to be collected.
   */
  private async fillDropNode(orderId: string): Promise<void> {
    const context =
      await this.webhookLogsRepository.findCustomTaskRunNoticeContext(orderId);
    if (!context) return;

    const route = context.taskPath.split(',').map((leg) => leg.trim());
    const drop = route[route.length - 1];
    if (!drop) return;

    const codes = await this.warehouseCodes();
    if (!codes.has(drop)) return;

    await this.rcsStockStatusService.updateStockStatus(drop, NODE_STATUS_FULL);
    this.realtime.publish('stock');

    this.realtime.publishWarehouseNotice({
      kind: 'drop-done',
      requester: context.requester,
      nodeCode: drop,
      robotName: context.robotName,
      orderId,
    });
  }

  private async clearPickupNode(orderId: string): Promise<void> {
    const taskPath =
      await this.webhookLogsRepository.findCustomTaskRunTaskPathByOrderId(
        orderId,
      );
    if (!taskPath) return;

    const pickup = taskPath.split(',')[0]?.trim();
    if (!pickup) return;

    const { items } = await this.warehouseLocationsRepository.findAll({
      page: 1,
      limit: 1000,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    const isWarehouseNode = items.some(
      (location) =>
        location.isActive &&
        !location.deletedAt &&
        location.iRaypleLocationCode === pickup,
    );
    if (!isWarehouseNode) return;

    // updateStockStatus, not setStockStatus: a failed call here must not
    // break webhook processing, and RCS retries the webhook on anything
    // but a 1000 ack.
    await this.rcsStockStatusService.updateStockStatus(
      pickup,
      NODE_STATUS_EMPTY,
    );
    this.realtime.publish('stock');
  }

  async execute(body: Record<string, unknown>) {
    // Always ack 1000 — RCS retries indefinitely (per its own retry policy)
    // until we do, and retrying can't fix a payload we don't recognize or
    // a taskId we don't have. We've already logged the raw payload below for
    // follow-up, so failing the delivery would only cause a retry storm.
    const responsePayload = { code: 1000, desc: '' };

    try {
      // The reference doc spells this "ordeId" in one place — accept both.
      const orderId = this.readString(body, ['orderId', 'ordeId']);
      const deviceCode = this.readString(body, ['deviceCode']);
      const rawStatus = this.readString(body, ['status']);

      if (orderId && rawStatus) {
        const status = normalizeStatus(rawStatus);
        const robotId = deviceCode
          ? ((await this.webhookLogsRepository.findRobotIdByDeviceCode(
              deviceCode,
            )) ?? undefined)
          : undefined;

        const matchedTask =
          await this.webhookLogsRepository.updateTaskStatusByTaskId(
            orderId,
            status,
            robotId,
          );
        if (!matchedTask) {
          const matchedCartTask =
            await this.webhookLogsRepository.updateWarehouseCartTaskStatusByTaskId(
              orderId,
              status,
              robotId,
            );
          if (!matchedCartTask) {
            // A Custom Task released from the scan page owns this orderId
            // too — same fall-through chain, so All Tasks > Custom Tasks
            // shows a live status instead of a row stuck on PENDING.
            const matchedCustomTask =
              await this.webhookLogsRepository.updateCustomTaskRunStatusByTaskId(
                orderId,
                status,
                robotId,
              );

            // The rack has just been lifted, so the node it came from is
            // now empty whatever RCS still has recorded for it.
            if (matchedCustomTask) {
              await this.notifyWarehouseRunning(orderId);
              if (rawStatus === RCS_PICKED_CODE) {
                await this.clearPickupNode(orderId);
              }
              if (rawStatus === RCS_PLACED_CODE) {
                await this.fillDropNode(orderId);
              }
            }
            const matchedTrolleyActivity =
              await this.webhookLogsRepository.updateTrolleyActivityStatusByTaskId(
                orderId,
                status,
                robotId,
              );
            // Production->Warehouse activities are submitted without a
            // droppingLocationCode (RCS picks its own destination and never
            // confirms it back to us) — see CreateTrolleyActivityUseCase.
            // Once RCS reports the task truly finished, ask RCS itself where
            // the order actually ended up (rather than trust our own
            // submit-time guess) and record that. The row with the highest
            // subTaskSeq is the furthest/last point the order actually
            // reached. Left unset (no fallback guess) if RCS can't confirm
            // it right now — a later retry of this same webhook, or another
            // completed activity for the same trolley, gets another chance.
            if (matchedTrolleyActivity && status === TaskStatus.COMPLETED) {
              const progress =
                await this.taskOrderService.getTaskOrderStatus(orderId);
              const finalStep = progress.reduce<
                (typeof progress)[number] | null
              >(
                (latest, row) =>
                  !latest || row.subTaskSeq > latest.subTaskSeq ? row : latest,
                null,
              );
              if (finalStep?.qrContent) {
                await this.webhookLogsRepository.setTrolleyActivityDroppingLocation(
                  orderId,
                  finalStep.qrContent,
                );
              }
            }
          }
        }
      }
    } catch {
      // Swallow — the raw payload is logged below regardless, so nothing is
      // lost; we just couldn't act on it automatically this time.
    }

    await this.webhookLogsRepository.createLog({
      method: 'POST',
      endpoint: '/webhooks-logs',
      requestPayload: body,
      responsePayload,
    });

    // Published once the writes above have landed, so a client that
    // refetches on this signal cannot read the row as it was before. RCS
    // pushing to us is what makes the whole task side of the UI live —
    // every task list, Current Queue card and Performance count is waiting
    // on exactly this. Sent even when the payload matched nothing of ours,
    // since the Webhook Logs page shows the raw call either way.
    this.realtime.publish('tasks');
    this.realtime.publish('custom-tasks');
    this.realtime.publish('trolley-activities');

    return responsePayload;
  }

  private readString(
    body: Record<string, unknown>,
    keys: string[],
  ): string | undefined {
    for (const key of keys) {
      const value = body[key];
      if (value != null && value !== '') return String(value);
    }
    return undefined;
  }
}
