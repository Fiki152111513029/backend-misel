import { Inject, Injectable } from '@nestjs/common';
import { WarehouseOperatorLocationQueryDto } from '../dto/warehouse-operator-location-query.dto';
import { WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY } from '../repositories/warehouse-operator-location-repository.interface';
import type { IWarehouseOperatorLocationsRepository } from '../repositories/warehouse-operator-location-repository.interface';

@Injectable()
export class GetWarehouseOperatorLocationsUseCase {
  constructor(
    @Inject(WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY)
    private readonly warehouseOperatorLocationsRepository: IWarehouseOperatorLocationsRepository,
  ) {}

  async execute(query: WarehouseOperatorLocationQueryDto) {
    const { items, total } =
      await this.warehouseOperatorLocationsRepository.findAll(query);

    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
