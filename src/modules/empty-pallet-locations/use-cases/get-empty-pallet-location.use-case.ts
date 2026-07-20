import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EMPTY_PALLET_LOCATIONS_REPOSITORY } from '../repositories/empty-pallet-location-repository.interface';
import type { IEmptyPalletLocationsRepository } from '../repositories/empty-pallet-location-repository.interface';

@Injectable()
export class GetEmptyPalletLocationUseCase {
  constructor(
    @Inject(EMPTY_PALLET_LOCATIONS_REPOSITORY)
    private readonly emptyPalletLocationsRepository: IEmptyPalletLocationsRepository,
  ) {}

  async execute(id: string) {
    const emptyPalletLocation =
      await this.emptyPalletLocationsRepository.findById(id);
    if (!emptyPalletLocation) {
      throw new NotFoundException('Empty Pallet Location not found');
    }
    return emptyPalletLocation;
  }
}
