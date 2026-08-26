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
// that node in RCS and creates an *open* TrolleyActivity row (statusBeginning,
// pickupLocationCode, startDate — no statusEnd/endDate/RCS task order yet).
// No Trolley status/currentLocationCode change here — that's still purely a
// Drop Trolley concern (the position lock). Drop Trolley
// (CreateTrolleyActivityUseCase) later finds this same open row and
// completes it, rather than creating a second one, once the trolley is
// actually handed off — see the TrolleyActivity model's doc comment in
// schema.prisma.
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

    await this.rcsStockStatusService.updateStockStatus(
      dto.pickupLocationCode,
      NODE_STATUS_EMPTY,
    );

    const activity = await this.trolleyActivitiesRepository.createOpen({
      userId,
      trolleyId: trolley.id,
      statusBeginning: trolley.status,
      pickupLocationCode: dto.pickupLocationCode,
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
