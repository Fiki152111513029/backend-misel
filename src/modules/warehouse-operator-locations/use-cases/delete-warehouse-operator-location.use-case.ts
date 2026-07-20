import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY } from '../repositories/warehouse-operator-location-repository.interface';
import type { IWarehouseOperatorLocationsRepository } from '../repositories/warehouse-operator-location-repository.interface';

@Injectable()
export class DeleteWarehouseOperatorLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY)
    private readonly warehouseOperatorLocationsRepository: IWarehouseOperatorLocationsRepository,
  ) {}

  async execute(id: string) {
    const existing =
      await this.warehouseOperatorLocationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Warehouse Operator Location not found');
    }
    await this.warehouseOperatorLocationsRepository.softDelete(id);
  }
}
