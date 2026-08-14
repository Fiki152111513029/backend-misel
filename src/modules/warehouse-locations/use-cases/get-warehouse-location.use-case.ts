import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../repositories/warehouse-location-repository.interface';

@Injectable()
export class GetWarehouseLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
  ) {}

  async execute(id: string) {
    const warehouseLocation =
      await this.warehouseLocationsRepository.findById(id);
    if (!warehouseLocation) {
      throw new NotFoundException('Warehouse Location not found');
    }
    return warehouseLocation;
  }
}
