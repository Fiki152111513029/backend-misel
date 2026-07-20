import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WAREHOUSE_LINE_LOCATIONS_REPOSITORY } from '../repositories/warehouse-line-location-repository.interface';
import type { IWarehouseLineLocationsRepository } from '../repositories/warehouse-line-location-repository.interface';

@Injectable()
export class GetWarehouseLineLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_LINE_LOCATIONS_REPOSITORY)
    private readonly warehouseLineLocationsRepository: IWarehouseLineLocationsRepository,
  ) {}

  async execute(id: string) {
    const warehouseLineLocation =
      await this.warehouseLineLocationsRepository.findById(id);
    if (!warehouseLineLocation) {
      throw new NotFoundException('Warehouse Line Location not found');
    }
    return warehouseLineLocation;
  }
}
