import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateEmptyPalletLocationDto } from '../dto/update-empty-pallet-location.dto';
import { EMPTY_PALLET_LOCATIONS_REPOSITORY } from '../repositories/empty-pallet-location-repository.interface';
import type { IEmptyPalletLocationsRepository } from '../repositories/empty-pallet-location-repository.interface';

@Injectable()
export class UpdateEmptyPalletLocationUseCase {
  constructor(
    @Inject(EMPTY_PALLET_LOCATIONS_REPOSITORY)
    private readonly emptyPalletLocationsRepository: IEmptyPalletLocationsRepository,
  ) {}

  async execute(id: string, dto: UpdateEmptyPalletLocationDto) {
    const existing = await this.emptyPalletLocationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Empty Pallet Location not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.emptyPalletLocationsRepository.existsByName(
        dto.name,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException(
          'Empty Pallet Location name already in use',
        );
      }
    }

    if (
      dto.iRaypleLocationCode &&
      dto.iRaypleLocationCode !== existing.iRaypleLocationCode
    ) {
      const codeTaken =
        await this.emptyPalletLocationsRepository.existsByLocationCode(
          dto.iRaypleLocationCode,
          id,
        );
      if (codeTaken) {
        throw new BadRequestException('iRayple Location Code already in use');
      }
    }

    return this.emptyPalletLocationsRepository.update(id, dto);
  }
}
