import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../repositories/production-location-repository.interface';

@Injectable()
export class DeleteProductionLocationUseCase {
  constructor(
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.productionLocationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Production Location not found');
    }

    await this.productionLocationsRepository.softDelete(id);
  }
}
