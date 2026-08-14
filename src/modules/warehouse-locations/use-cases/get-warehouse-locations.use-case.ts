import { Inject, Injectable } from '@nestjs/common';
import { WarehouseLocationQueryDto } from '../dto/warehouse-location-query.dto';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../repositories/warehouse-location-repository.interface';

@Injectable()
export class GetWarehouseLocationsUseCase {
  constructor(
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
  ) {}

  async execute(query: WarehouseLocationQueryDto) {
    const { items, total } =
      await this.warehouseLocationsRepository.findAll(query);

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
