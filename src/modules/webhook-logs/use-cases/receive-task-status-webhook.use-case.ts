import { Inject, Injectable, Logger } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { WEBHOOK_LOGS_REPOSITORY } from '../repositories/webhook-log-repository.interface';
import type { IWebhookLogsRepository } from '../repositories/webhook-log-repository.interface';
import { TROLLEYS_REPOSITORY } from '../../trolleys/repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../../trolleys/repositories/trolley-repository.interface';
import {
  RcsStockStatusService,
  NODE_STATUS_EMPTY,
  NODE_STATUS_FULL,
} from '../../rcs-stock-status/rcs-stock-status.service';

// RCS's own OrderStatus codes (see docs/apiwebhook.md and the Mainline
// status mapping) — 8 is the only success code, 3/5/7 are terminal
// failures, everything else (6/9/10/20/21/22/23, or anything we don't
// recognize yet) is treated as still in progress.
const RCS_COMPLETED_CODE = '8';
const RCS_FAILED_CODES = ['3', '5', '7'];
// Trolley Task sub-steps (see Frontend's RCS_STATUS_LABEL) — the two moments
// that actually matter for stock-status/location tracking: the robot has
// physically picked the trolley up off its pickup location (vacating it),
// or physically placed it at its dropping location (occupying it).
const RCS_PICKED_CODE = '21';
const RCS_PLACED_CODE = '23';

function normalizeStatus(rawStatus: string): TaskStatus {
  if (rawStatus === TaskStatus.COMPLETED || rawStatus === RCS_COMPLETED_CODE) {
    return TaskStatus.COMPLETED;
  }
  if (
    rawStatus === TaskStatus.FAILED ||
    RCS_FAILED_CODES.includes(rawStatus)
  ) {
    return TaskStatus.FAILED;
  }
  if (rawStatus === TaskStatus.PENDING) {
    return TaskStatus.PENDING;
  }
  return TaskStatus.IN_PROGRESS;
}

@Injectable()
export class ReceiveTaskStatusWebhookUseCase {
  private readonly logger = new Logger(ReceiveTaskStatusWebhookUseCase.name);

  constructor(
    @Inject(WEBHOOK_LOGS_REPOSITORY)
    private readonly webhookLogsRepository: IWebhookLogsRepository,
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
    private readonly rcsStockStatusService: RcsStockStatusService,
  ) {}

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
            const matchedTrolleyActivity =
              await this.webhookLogsRepository.updateTrolleyActivityStatusByTaskId(
                orderId,
                status,
                robotId,
              );
            if (
              matchedTrolleyActivity &&
              (rawStatus === RCS_PICKED_CODE || rawStatus === RCS_PLACED_CODE)
            ) {
              await this.handleTrolleyPickedOrPlaced(orderId, rawStatus);
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

  // Picked (21): the robot has physically lifted the trolley off its pickup
  // location — tell RCS that location is empty. Placed (23): the robot has
  // physically set the trolley down at its dropping location — tell RCS
  // that location is full, and advance Trolley.currentLocationCode so the
  // *next* Trolley Task for this trolley is locked to start from here (see
  // CreateTrolleyActivityUseCase).
  private async handleTrolleyPickedOrPlaced(
    orderId: string,
    rawStatus: string,
  ): Promise<void> {
    const locations =
      await this.webhookLogsRepository.findTrolleyActivityLocationsByTaskId(
        orderId,
      );
    if (!locations) return;

    if (rawStatus === RCS_PICKED_CODE) {
      await this.rcsStockStatusService.updateStockStatus(
        locations.pickupLocationCode,
        NODE_STATUS_EMPTY,
      );
      return;
    }

    if (!locations.droppingLocationCode) {
      this.logger.warn(
        `Trolley Activity for taskId ${orderId} reported Placed but has no droppingLocationCode`,
      );
      return;
    }
    await this.rcsStockStatusService.updateStockStatus(
      locations.droppingLocationCode,
      NODE_STATUS_FULL,
    );
    await this.trolleysRepository.update(locations.trolleyId, {
      currentLocationCode: locations.droppingLocationCode,
    });
  }
}
