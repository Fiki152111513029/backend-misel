import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WAREHOUSE_LINE_LOCATIONS_REPOSITORY } from '../repositories/warehouse-line-location-repository.interface';
import type { IWarehouseLineLocationsRepository } from '../repositories/warehouse-line-location-repository.interface';

@Injectable()
export class DeleteWarehouseLineLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_LINE_LOCATIONS_REPOSITORY)
    private readonly warehouseLineLocationsRepository: IWarehouseLineLocationsRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.warehouseLineLocationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Warehouse Line Location not found');
    }
    await this.warehouseLineLocationsRepository.softDelete(id);
  }
}
