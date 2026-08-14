import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateProductionLocationDto } from '../dto/create-production-location.dto';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../repositories/production-location-repository.interface';

@Injectable()
export class CreateProductionLocationUseCase {
  constructor(
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
  ) {}

  async execute(dto: CreateProductionLocationDto) {
    const nameTaken = await this.productionLocationsRepository.existsByName(
      dto.name,
    );
    if (nameTaken) {
      throw new BadRequestException('Production Location name already in use');
    }

    const codeTaken =
      await this.productionLocationsRepository.existsByLocationCode(
        dto.iRaypleLocationCode,
      );
    if (codeTaken) {
      throw new BadRequestException('iRayple Location Code already in use');
    }

    try {
      return await this.productionLocationsRepository.create(dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'A Production Location with this name or code is already in use',
        );
      }
      throw error;
    }
  }
}
