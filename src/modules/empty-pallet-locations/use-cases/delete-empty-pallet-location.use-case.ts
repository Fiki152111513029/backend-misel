import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EMPTY_PALLET_LOCATIONS_REPOSITORY } from '../repositories/empty-pallet-location-repository.interface';
import type { IEmptyPalletLocationsRepository } from '../repositories/empty-pallet-location-repository.interface';

@Injectable()
export class DeleteEmptyPalletLocationUseCase {
  constructor(
    @Inject(EMPTY_PALLET_LOCATIONS_REPOSITORY)
    private readonly emptyPalletLocationsRepository: IEmptyPalletLocationsRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.emptyPalletLocationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Empty Pallet Location not found');
    }

    const hasActiveProductionLineAreas =
      await this.emptyPalletLocationsRepository.hasActiveProductionLineAreas(
        id,
      );
    if (hasActiveProductionLineAreas) {
      throw new BadRequestException(
        'Cannot delete an Empty Pallet Location that has Production Line Areas',
      );
    }

    await this.emptyPalletLocationsRepository.softDelete(id);
  }
}
