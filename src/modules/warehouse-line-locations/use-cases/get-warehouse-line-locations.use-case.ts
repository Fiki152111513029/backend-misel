import { Inject, Injectable } from '@nestjs/common';
import { WarehouseLineLocationQueryDto } from '../dto/warehouse-line-location-query.dto';
import { WAREHOUSE_LINE_LOCATIONS_REPOSITORY } from '../repositories/warehouse-line-location-repository.interface';
import type { IWarehouseLineLocationsRepository } from '../repositories/warehouse-line-location-repository.interface';

@Injectable()
export class GetWarehouseLineLocationsUseCase {
  constructor(
    @Inject(WAREHOUSE_LINE_LOCATIONS_REPOSITORY)
    private readonly warehouseLineLocationsRepository: IWarehouseLineLocationsRepository,
  ) {}

  async execute(query: WarehouseLineLocationQueryDto) {
    const { items, total } =
      await this.warehouseLineLocationsRepository.findAll(query);

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
