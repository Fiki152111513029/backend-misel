import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../../production-locations/repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../../production-locations/repositories/production-location-repository.interface';
import { LookupLocationDto } from '../dto/lookup-location.dto';

// Second scan of the flow — resolves the scanned code against Warehouse
// Locations (Warehouse->Production direction: this becomes "pickup", the
// trolley's own fixed droppingLocationCode is the dropping point) or,
// failing that, Production Locations (Production->Warehouse direction: this
// becomes "pickup", dropping is auto-picked from whichever Warehouse
// Location is EMPTY — see CreateTrolleyActivityUseCase). Nothing is
// persisted here either way — this is a read-only lookup.
@Injectable()
export class LookupLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
  ) {}

  async execute(dto: LookupLocationDto) {
    const warehouseLocation =
      await this.warehouseLocationsRepository.findActiveByLocationCode(
        dto.code,
      );
    if (warehouseLocation) {
      return {
        pickupLocationCode: warehouseLocation.iRaypleLocationCode,
        pickupLocationName: warehouseLocation.name,
        pickupLocationSource: 'WAREHOUSE' as const,
      };
    }

    const productionLocation =
      await this.productionLocationsRepository.findActiveByLocationCode(
        dto.code,
      );
    if (productionLocation) {
      return {
        pickupLocationCode: productionLocation.iRaypleLocationCode,
        pickupLocationName: productionLocation.name,
        pickupLocationSource: 'PRODUCTION' as const,
      };
    }

    throw new BadRequestException(
      'Location not found for this code — must match an active Warehouse Location or Production Location',
    );
  }
}
