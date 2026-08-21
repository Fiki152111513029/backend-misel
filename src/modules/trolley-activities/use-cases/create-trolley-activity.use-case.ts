import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ProductionLocation, TrolleyStatus, WarehouseLocation } from '@prisma/client';
import { TROLLEYS_REPOSITORY } from '../../trolleys/repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../../trolleys/repositories/trolley-repository.interface';
import { USERS_REPOSITORY } from '../../users/repositories/users-repository.interface';
import type { IUsersRepository } from '../../users/repositories/users-repository.interface';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../../production-locations/repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../../production-locations/repositories/production-location-repository.interface';
import { TaskOrderService, TaskOrderPayload } from '../../tasks/services/task-order.service';
import { generateOrderId } from '../../tasks/utils/generate-order-id';
import { CreateTrolleyActivityDto } from '../dto/create-trolley-activity.dto';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';

function toggleStatus(status: TrolleyStatus): TrolleyStatus {
  return status === TrolleyStatus.EMPTY ? TrolleyStatus.FULL : TrolleyStatus.EMPTY;
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
  ) {}

  async execute(dto: CreateTrolleyActivityDto, userId: string) {
    const trolley = await this.trolleysRepository.findById(dto.trolleyId);
    if (!trolley) {
      throw new BadRequestException('Trolley not found');
    }
    if (!trolley.modelCodeProcess) {
      throw new BadRequestException(
        'This trolley has no Model Code Process configured — configure it on the Trolley first',
      );
    }

    // Position lock: once RCS has confirmed (via the "Placed" webhook event)
    // that this trolley is physically sitting at a location, it can't be
    // released again from anywhere else — it has to be picked up from
    // wherever it actually is. Null means RCS hasn't reported a Placed event
    // for this trolley yet, so there's nothing to lock against.
    if (
      trolley.currentLocationCode &&
      trolley.currentLocationCode !== dto.pickupLocationCode
    ) {
      throw new BadRequestException(
        `This trolley is currently at ${trolley.currentLocationCode} — scan that location to release it, not ${dto.pickupLocationCode}`,
      );
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Direction is derived from where the scanned pickup code resolves to —
    // never trusted from the client:
    // - Warehouse Location match -> Warehouse->Production. Dropping is the
    //   trolley's own fixed droppingLocationCode (a Production Location).
    //   The Warehouse Location is vacated (EMPTY) once picked up from, and
    //   the Production Location it's dropped at is now occupied (FULL) —
    //   this is what the Factory Map's node icons reflect.
    // - Production Location match -> Production->Warehouse. The Production
    //   Location is vacated (EMPTY) once picked up from. Dropping is
    //   auto-picked from whichever Warehouse Location is currently EMPTY,
    //   then flipped to FULL.
    const pickupWarehouseLocation =
      await this.warehouseLocationsRepository.findActiveByLocationCode(
        dto.pickupLocationCode,
      );

    let droppingLocationCode: string;
    let warehouseLocationToFree: WarehouseLocation | null = null;
    let warehouseLocationToOccupy: WarehouseLocation | null = null;
    let productionLocationToFree: ProductionLocation | null = null;
    let productionLocationToOccupy: ProductionLocation | null = null;

    if (pickupWarehouseLocation) {
      if (!trolley.droppingLocationCode) {
        throw new BadRequestException(
          'This trolley has no Dropping Location Code set — configure it on the Trolley first',
        );
      }
      droppingLocationCode = trolley.droppingLocationCode;
      warehouseLocationToFree = pickupWarehouseLocation;
      productionLocationToOccupy =
        await this.productionLocationsRepository.findActiveByLocationCode(
          trolley.droppingLocationCode,
        );
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
    }

    const statusBeginning = trolley.status;
    const statusEnd = toggleStatus(statusBeginning);
    const startDate = new Date(dto.startDate);
    const endDate = new Date();
    const taskPath = [dto.pickupLocationCode, droppingLocationCode].join(',');
    const orderId = generateOrderId();

    const rcsRequest: TaskOrderPayload = {
      modelProcessCode: trolley.modelCodeProcess.name,
      priority: user.priority,
      fromSystem: trolley.modelCodeProcess.fromSystem,
      orderId,
      taskOrderDetail: [{ taskPath }],
    };

    // Call RCS first — only persist the activity (and flip the trolley's
    // status / the Warehouse Location's occupancy) once the order is
    // actually accepted, same ordering Mainline's release-task flow uses.
    const rcsResponse = await this.taskOrderService.addTask(rcsRequest);

    const activity = await this.trolleyActivitiesRepository.create({
      userId,
      trolleyId: trolley.id,
      statusBeginning,
      statusEnd,
      pickupLocationCode: dto.pickupLocationCode,
      droppingLocationCode,
      startDate,
      endDate,
      taskId: orderId,
    });

    await this.trolleysRepository.update(trolley.id, { status: statusEnd });

    if (warehouseLocationToFree) {
      await this.warehouseLocationsRepository.update(warehouseLocationToFree.id, {
        status: 'EMPTY',
      });
    }
    if (warehouseLocationToOccupy) {
      await this.warehouseLocationsRepository.update(warehouseLocationToOccupy.id, {
        status: 'FULL',
      });
    }
    if (productionLocationToFree) {
      await this.productionLocationsRepository.update(productionLocationToFree.id, {
        status: 'EMPTY',
      });
    }
    if (productionLocationToOccupy) {
      await this.productionLocationsRepository.update(productionLocationToOccupy.id, {
        status: 'FULL',
      });
    }

    return { activity, rcsRequest, rcsResponse };
  }
}
