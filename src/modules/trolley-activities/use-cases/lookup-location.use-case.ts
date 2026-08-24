import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../../production-locations/repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../../production-locations/repositories/production-location-repository.interface';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';
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
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
  ) {}

  async execute(dto: LookupLocationDto) {
    const warehouseLocation =
      await this.warehouseLocationsRepository.findActiveByLocationCode(
        dto.code,
      );
    if (warehouseLocation) {
      // A Warehouse Location scanned here is being picked up FROM (Warehouse
      // ->Production) — warn if some other in-flight Trolley Task is already
      // heading to this exact node, so the operator doesn't miss an AMR
      // about to arrive at the same spot.
      const incoming =
        await this.trolleyActivitiesRepository.findActiveIncomingByLocationCode(
          warehouseLocation.iRaypleLocationCode,
        );

      return {
        pickupLocationCode: warehouseLocation.iRaypleLocationCode,
        pickupLocationName: warehouseLocation.name,
        pickupLocationSource: 'WAREHOUSE' as const,
        incomingWarning: incoming
          ? `An AMR is already bringing trolley ${incoming.trolleyName} (${incoming.trolleyCode}) to this node`
          : null,
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
        incomingWarning: null,
      };
    }

    throw new BadRequestException(
      'Location not found for this code — must match an active Warehouse Location or Production Location',
    );
  }
}
