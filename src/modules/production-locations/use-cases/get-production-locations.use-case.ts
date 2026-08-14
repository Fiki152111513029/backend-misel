import { Inject, Injectable } from '@nestjs/common';
import { ProductionLocationQueryDto } from '../dto/production-location-query.dto';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../repositories/production-location-repository.interface';

@Injectable()
export class GetProductionLocationsUseCase {
  constructor(
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
  ) {}

  async execute(query: ProductionLocationQueryDto) {
    const { items, total } =
      await this.productionLocationsRepository.findAll(query);

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
