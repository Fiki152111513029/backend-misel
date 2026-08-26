import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ProductionLocation,
  TrolleyStatus,
  WarehouseLocation,
} from '@prisma/client';
import { TROLLEYS_REPOSITORY } from '../../trolleys/repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../../trolleys/repositories/trolley-repository.interface';
import { USERS_REPOSITORY } from '../../users/repositories/users-repository.interface';
import type { IUsersRepository } from '../../users/repositories/users-repository.interface';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../../production-locations/repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../../production-locations/repositories/production-location-repository.interface';
import {
  TaskOrderService,
  TaskOrderPayload,
} from '../../tasks/services/task-order.service';
import { generateOrderId } from '../../tasks/utils/generate-order-id';
import {
  RcsStockStatusService,
  NODE_STATUS_EMPTY,
  NODE_STATUS_FULL,
} from '../../rcs-stock-status/rcs-stock-status.service';
import { CreateTrolleyActivityDto } from '../dto/create-trolley-activity.dto';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';

function toggleStatus(status: TrolleyStatus): TrolleyStatus {
  return status === TrolleyStatus.EMPTY
    ? TrolleyStatus.FULL
    : TrolleyStatus.EMPTY;
}

@Injectable()
export class CreateTrolleyActivityUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
    private readonly taskOrderService: TaskOrderService,
    private readonly rcsStockStatusService: RcsStockStatusService,
  ) {}

  async execute(dto: CreateTrolleyActivityDto, userId: string) {
    const trolley = await this.trolleysRepository.findById(dto.trolleyId);
    if (!trolley) {
      throw new BadRequestException('Trolley not found');
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // A prior Take Trolley may have already opened a row for this trolley
    // (statusEnd still null) — complete that one instead of creating a
    // second row. If there isn't one, Drop Trolley still works completely
    // standalone (create a fully-populated row in one step, as before).
    const openActivity = await this.trolleyActivitiesRepository.findOpenByTrolleyId(
      trolley.id,
    );

    // Direction is derived from where the scanned pickup code resolves to —
    // never trusted from the client:
    // - Warehouse Location match -> Warehouse->Production (Warehouse
    //   Trolley Task). Dropping is the trolley's own fixed
    //   droppingLocationCode (a Production Location); taskPath is the full
    //   pickup->dropping pair. The Warehouse Location is vacated (EMPTY)
    //   once picked up from, and the Production Location it's dropped at is
    //   now occupied (FULL) — this is what the Factory Map's node icons
    //   reflect. modelProcessCode comes from the trolley's own Model Code
    //   Process, priority from the releasing user.
    // - Production Location match -> Production->Warehouse (Operator
    //   Trolley Task). taskPath is just the pickup point — RCS decides
    //   which Warehouse Location to bring the trolley to on its own, we
    //   don't tell it where. We still auto-pick + record an EMPTY Warehouse
    //   Location ourselves for our own bookkeeping (Factory Map icons, the
    //   activity's own droppingLocationCode), since RCS doesn't report its
    //   choice back to us ahead of time. modelProcessCode comes from the
    //   trolley's Category's Model Code Process (not the
    //   trolley's own), priority is fixed.
    const OPERATOR_DIRECTION_PRIORITY = 6;

    const pickupWarehouseLocation =
      await this.warehouseLocationsRepository.findActiveByLocationCode(
        dto.pickupLocationCode,
      );

    let droppingLocationCode: string;
    let warehouseLocationToFree: WarehouseLocation | null = null;
    let warehouseLocationToOccupy: WarehouseLocation | null = null;
    let productionLocationToFree: ProductionLocation | null = null;
    let productionLocationToOccupy: ProductionLocation | null = null;
    let modelProcessCode: string;
    let fromSystem: string;
    let priority: number;
    let taskPath: string;

    if (pickupWarehouseLocation) {
      if (!trolley.droppingLocationCode) {
        throw new BadRequestException(
          'This trolley has no Dropping Location Code set — configure it on the Trolley first',
        );
      }
      if (!trolley.modelCodeProcess) {
        throw new BadRequestException(
          'This trolley has no Model Code Process configured — configure it on the Trolley first',
        );
      }
      droppingLocationCode = trolley.droppingLocationCode;
      warehouseLocationToFree = pickupWarehouseLocation;
      productionLocationToOccupy =
        await this.productionLocationsRepository.findActiveByLocationCode(
          trolley.droppingLocationCode,
        );
      modelProcessCode = trolley.modelCodeProcess.name;
      fromSystem = trolley.modelCodeProcess.fromSystem;
      priority = user.priority;
      taskPath = [dto.pickupLocationCode, droppingLocationCode].join(',');
    } else {
      const pickupProductionLocation =
        await this.productionLocationsRepository.findActiveByLocationCode(
          dto.pickupLocationCode,
        );
      if (!pickupProductionLocation) {
        throw new BadRequestException(
          'Pickup location code does not match an active Warehouse Location or Production Location',
        );
      }
      if (!trolley.category?.modelCodeProcess) {
        throw new BadRequestException(
          "This trolley's Category has no Model Code Process configured — configure it on the Trolley Category first",
        );
      }
      productionLocationToFree = pickupProductionLocation;
      const emptyWarehouseLocation =
        await this.warehouseLocationsRepository.findFirstActiveEmpty();
      if (!emptyWarehouseLocation) {
        throw new BadRequestException(
          'No empty Warehouse Location is available for dropping right now',
        );
      }
      droppingLocationCode = emptyWarehouseLocation.iRaypleLocationCode;
      warehouseLocationToOccupy = emptyWarehouseLocation;
      modelProcessCode = trolley.category.modelCodeProcess.name;
      fromSystem = trolley.category.modelCodeProcess.fromSystem;
      priority = OPERATOR_DIRECTION_PRIORITY;
      taskPath = dto.pickupLocationCode;
    }

    const statusBeginning = trolley.status;
    const statusEnd = toggleStatus(statusBeginning);
    // The open row's own startDate (set when Take Trolley ran) wins over
    // dto.startDate when one exists — it's the real moment prep began, so
    // Duration (endDate - startDate) reflects the true Take-to-Drop span.
    const startDate = openActivity ? openActivity.startDate : new Date(dto.startDate);
    const endDate = new Date();
    const orderId = generateOrderId();

    const rcsRequest: TaskOrderPayload = {
      modelProcessCode,
      priority,
      fromSystem,
      orderId,
      taskOrderDetail: [{ taskPath }],
    };

    // Both stock-status calls target the scanned pickup node, not the
    // dropping node — RCS owns the dropping node's own status itself once
    // its robot actually completes the delivery there, so we never report
    // that one. Empty first (now that the operator has scanned both the
    // trolley and this exact area and is submitting — deferred to here,
    // rather than the earlier scan steps, so the node it targets is always
    // the one actually confirmed by scan, not inferred), then full again
    // once the task is actually handed off to RCS. Fire-and-forget (not
    // awaited) — updateStockStatus already swallows its own errors and
    // nothing downstream depends on its result, so blocking the operator's
    // submit on it just adds RCS's own latency (each call has a 5s timeout)
    // straight onto their wait time for no benefit.
    void this.rcsStockStatusService.updateStockStatus(
      dto.pickupLocationCode,
      NODE_STATUS_EMPTY,
    );

    // Call RCS first — only persist the activity (and flip the trolley's
    // status / the Warehouse Location's occupancy) once the order is
    // actually accepted, same ordering Mainline's release-task flow uses.
    const rcsResponse = await this.taskOrderService.addTask(rcsRequest);

    void this.rcsStockStatusService.updateStockStatus(
      dto.pickupLocationCode,
      NODE_STATUS_FULL,
    );

    // Warehouse->Production knows its dropping point for certain (the
    // trolley's own fixed code), so the activity record gets it right away.
    // Production->Warehouse only *tentatively* reserves a Warehouse Location
    // ourselves — RCS decides its own destination and never confirms its
    // choice back to us — so that one is left off the activity record until
    // RCS actually reports the task finished (status 8 backfills it from
    // Trolley.currentLocationCode, see ReceiveTaskStatusWebhookUseCase),
    // rather than risk recording a location the task never really reached.
    const isOperatorDirection = !pickupWarehouseLocation;

    const activity = openActivity
      ? await this.trolleyActivitiesRepository.completeById(openActivity.id, {
          statusEnd,
          pickupLocationCode: dto.pickupLocationCode,
          droppingLocationCode: isOperatorDirection ? undefined : droppingLocationCode,
          endDate,
          taskId: orderId,
        })
      : await this.trolleyActivitiesRepository.create({
          userId,
          trolleyId: trolley.id,
          statusBeginning,
          statusEnd,
          pickupLocationCode: dto.pickupLocationCode,
          droppingLocationCode: isOperatorDirection ? undefined : droppingLocationCode,
          queueRole: dto.queueRole,
          startDate,
          endDate,
          taskId: orderId,
        });

    // currentLocationCode is tracking only now (no longer gates submission)
    // — it still feeds the "AMR incoming" warning on the location scan step
    // (findActiveIncomingByLocationCode) and the Operator-direction
    // droppingLocationCode backfill on webhook completion. Updated
    // immediately here (not waiting for a webhook) to match the same
    // submit-time-driven design as the stock-status calls.
    await this.trolleysRepository.update(trolley.id, {
      status: statusEnd,
      currentLocationCode: droppingLocationCode,
    });

    if (warehouseLocationToFree) {
      await this.warehouseLocationsRepository.update(
        warehouseLocationToFree.id,
        {
          status: 'EMPTY',
        },
      );
    }
    if (warehouseLocationToOccupy) {
      await this.warehouseLocationsRepository.update(
        warehouseLocationToOccupy.id,
        {
          status: 'FULL',
        },
      );
    }
    if (productionLocationToFree) {
      await this.productionLocationsRepository.update(
        productionLocationToFree.id,
        {
          status: 'EMPTY',
        },
      );
    }
    if (productionLocationToOccupy) {
      await this.productionLocationsRepository.update(
        productionLocationToOccupy.id,
        {
          status: 'FULL',
        },
      );
    }

    return { activity, rcsRequest, rcsResponse };
  }
}
