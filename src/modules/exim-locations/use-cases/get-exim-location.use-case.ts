import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EXIM_LOCATIONS_REPOSITORY } from '../repositories/exim-location-repository.interface';
import type { IEximLocationsRepository } from '../repositories/exim-location-repository.interface';

@Injectable()
export class GetEximLocationUseCase {
  constructor(
    @Inject(EXIM_LOCATIONS_REPOSITORY)
    private readonly eximLocationsRepository: IEximLocationsRepository,
  ) {}

  async execute(id: string) {
    const eximLocation = await this.eximLocationsRepository.findById(id);
    if (!eximLocation) {
      throw new NotFoundException('EXIM Location not found');
    }
    return eximLocation;
  }
}
