import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import { LookupLocationDto } from '../dto/lookup-location.dto';

// Second scan of the flow — resolves the scanned code against Warehouse
// Locations to get "pickup". Nothing is persisted here either.
@Injectable()
export class LookupLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
  ) {}

  async execute(dto: LookupLocationDto) {
    const location =
      await this.warehouseLocationsRepository.findActiveByLocationCode(
        dto.code,
      );
    if (!location) {
      throw new BadRequestException(
        'Location not found for this code — must match an active Warehouse Location',
      );
    }

    return {
      pickupLocationCode: location.iRaypleLocationCode,
      pickupLocationName: location.name,
    };
  }
}
