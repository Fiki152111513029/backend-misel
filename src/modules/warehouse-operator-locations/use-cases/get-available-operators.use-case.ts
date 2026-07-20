import { Inject, Injectable } from '@nestjs/common';
import { WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY } from '../repositories/warehouse-operator-location-repository.interface';
import type { IWarehouseOperatorLocationsRepository } from '../repositories/warehouse-operator-location-repository.interface';

@Injectable()
export class GetAvailableOperatorsUseCase {
  constructor(
    @Inject(WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY)
    private readonly warehouseOperatorLocationsRepository: IWarehouseOperatorLocationsRepository,
  ) {}

  execute(excludeLocationId?: string) {
    return this.warehouseOperatorLocationsRepository.findAvailableOperators(
      excludeLocationId,
    );
  }
}
