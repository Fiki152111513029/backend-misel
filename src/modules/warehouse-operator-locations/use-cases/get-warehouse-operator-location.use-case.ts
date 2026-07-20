import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY } from '../repositories/warehouse-operator-location-repository.interface';
import type { IWarehouseOperatorLocationsRepository } from '../repositories/warehouse-operator-location-repository.interface';

@Injectable()
export class GetWarehouseOperatorLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY)
    private readonly warehouseOperatorLocationsRepository: IWarehouseOperatorLocationsRepository,
  ) {}

  async execute(id: string) {
    const warehouseOperatorLocation =
      await this.warehouseOperatorLocationsRepository.findById(id);
    if (!warehouseOperatorLocation) {
      throw new NotFoundException('Warehouse Operator Location not found');
    }
    return warehouseOperatorLocation;
  }
}
