import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateEmptyPalletLocationDto } from '../dto/create-empty-pallet-location.dto';
import { EMPTY_PALLET_LOCATIONS_REPOSITORY } from '../repositories/empty-pallet-location-repository.interface';
import type { IEmptyPalletLocationsRepository } from '../repositories/empty-pallet-location-repository.interface';

@Injectable()
export class CreateEmptyPalletLocationUseCase {
  constructor(
    @Inject(EMPTY_PALLET_LOCATIONS_REPOSITORY)
    private readonly emptyPalletLocationsRepository: IEmptyPalletLocationsRepository,
  ) {}

  async execute(dto: CreateEmptyPalletLocationDto) {
    const nameTaken = await this.emptyPalletLocationsRepository.existsByName(
      dto.name,
    );
    if (nameTaken) {
      throw new BadRequestException(
        'Empty Pallet Location name already in use',
      );
    }

    const codeTaken =
      await this.emptyPalletLocationsRepository.existsByLocationCode(
        dto.iRaypleLocationCode,
      );
    if (codeTaken) {
      throw new BadRequestException('iRayple Location Code already in use');
    }

    try {
      return await this.emptyPalletLocationsRepository.create(dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'An Empty Pallet Location with this name or code is already in use',
        );
      }
      throw error;
    }
  }
}
