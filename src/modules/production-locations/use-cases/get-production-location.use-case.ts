import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../repositories/production-location-repository.interface';

@Injectable()
export class GetProductionLocationUseCase {
  constructor(
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
  ) {}

  async execute(id: string) {
    const productionLocation =
      await this.productionLocationsRepository.findById(id);
    if (!productionLocation) {
      throw new NotFoundException('Production Location not found');
    }
    return productionLocation;
  }
}
