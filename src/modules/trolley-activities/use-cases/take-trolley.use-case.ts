import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TROLLEYS_REPOSITORY } from '../../trolleys/repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../../trolleys/repositories/trolley-repository.interface';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../../production-locations/repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../../production-locations/repositories/production-location-repository.interface';
import {
  RcsStockStatusService,
  NODE_STATUS_EMPTY,
} from '../../rcs-stock-status/rcs-stock-status.service';
import { generateOrderId } from '../../tasks/utils/generate-order-id';
import { TakeTrolleyDto } from '../dto/take-trolley.dto';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';

// Take Trolley — a standalone action, independent of Drop Trolley: scan
// trolley, scan the area it's currently sitting in, submit. Submit empties
// that node in RCS (fire-and-forget — see the call below) and creates an
// *open* TrolleyActivity row (userId, trolleyId, statusBeginning,
// pickupLocationCode, queueRole, startDate — no statusEnd/endDate/real RCS
// task order yet). No Trolley status/currentLocationCode change here —
// that's still purely a Drop Trolley concern. Drop Trolley
// (CreateTrolleyActivityUseCase) later finds this same open row and
// completes it, rather than creating a second one, once the trolley is
// actually handed off — see the TrolleyActivity model's doc comment in
// schema.prisma.
//
// If this trolley already has an open row (a previous Take Trolley that
// was never followed by a Drop Trolley — the operator re-scanning it, or
// switching pages partway through), this refreshes that same row instead
// of creating a second one — otherwise the older row would be orphaned
// forever: Drop Trolley only ever completes the *most recent* open row, so
// an earlier one left behind would never get picked up by anything.
@Injectable()
export class TakeTrolleyUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
    private readonly rcsStockStatusService: RcsStockStatusService,
  ) {}

  async execute(dto: TakeTrolleyDto, userId: string) {
    const trolley = await this.trolleysRepository.findById(dto.trolleyId);
    if (!trolley) {
      throw new BadRequestException('Trolley not found');
    }

    const warehouseLocation =
      await this.warehouseLocationsRepository.findActiveByLocationCode(
        dto.pickupLocationCode,
      );
    const productionLocation = warehouseLocation
      ? null
      : await this.productionLocationsRepository.findActiveByLocationCode(
          dto.pickupLocationCode,
        );
    if (!warehouseLocation && !productionLocation) {
      throw new BadRequestException(
        'Pickup location code does not match an active Warehouse Location or Production Location',
      );
    }

    // Fire-and-forget (not awaited) — updateStockStatus already swallows
    // its own errors and nothing here depends on its result, so blocking
    // the operator's submit on it just adds RCS's own latency (up to a 5s
    // timeout) straight onto their wait time for no benefit.
    void this.rcsStockStatusService.updateStockStatus(
      dto.pickupLocationCode,
      NODE_STATUS_EMPTY,
    );

    const existingOpenActivity =
      await this.trolleyActivitiesRepository.findOpenByTrolleyId(trolley.id);

    const activity = existingOpenActivity
      ? await this.trolleyActivitiesRepository.refreshOpenById(
          existingOpenActivity.id,
          {
            statusBeginning: trolley.status,
            pickupLocationCode: dto.pickupLocationCode,
            queueRole: dto.queueRole,
            startDate: new Date(),
            taskId: generateOrderId(),
          },
        )
      : await this.trolleyActivitiesRepository.createOpen({
          userId,
          trolleyId: trolley.id,
          statusBeginning: trolley.status,
          pickupLocationCode: dto.pickupLocationCode,
          queueRole: dto.queueRole,
          startDate: new Date(),
          taskId: generateOrderId(),
        });

    return {
      activityId: activity.id,
      trolleyId: trolley.id,
      trolleyCode: trolley.code,
      trolleyName: trolley.name,
      statusBeginning: activity.statusBeginning,
      pickupLocationCode: dto.pickupLocationCode,
      startDate: activity.startDate.toISOString(),
    };
  }
}
