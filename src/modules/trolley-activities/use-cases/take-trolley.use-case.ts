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
import { TakeTrolleyDto } from '../dto/take-trolley.dto';

// Take Trolley — a standalone action, independent of Drop Trolley: scan
// trolley, scan the area it's currently sitting in, submit. Submit is what
// actually empties that node in RCS and starts the prep timer. Nothing is
// persisted to our own DB here — no TrolleyActivity row, no RCS task order,
// no change to the trolley's status or currentLocationCode (the position
// lock). Drop Trolley (CreateTrolleyActivityUseCase) is the only place a
// TrolleyActivity row is ever written, in full, in one step.
@Injectable()
export class TakeTrolleyUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
    private readonly rcsStockStatusService: RcsStockStatusService,
  ) {}

  async execute(dto: TakeTrolleyDto) {
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

    return {
      trolleyId: trolley.id,
      trolleyCode: trolley.code,
      trolleyName: trolley.name,
      pickupLocationCode: dto.pickupLocationCode,
      startDate: new Date().toISOString(),
    };
  }
}
