import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../repositories/warehouse-location-repository.interface';

@Injectable()
export class DeleteWarehouseLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.warehouseLocationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Warehouse Location not found');
    }

    await this.warehouseLocationsRepository.softDelete(id);
  }
}
