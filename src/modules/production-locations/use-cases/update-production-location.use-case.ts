import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { UpdateProductionLocationDto } from '../dto/update-production-location.dto';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../repositories/production-location-repository.interface';

@Injectable()
export class UpdateProductionLocationUseCase {
  constructor(
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
  ) {}

  async execute(id: string, dto: UpdateProductionLocationDto) {
    const existing = await this.productionLocationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Production Location not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.productionLocationsRepository.existsByName(
        dto.name,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException('Production Location name already in use');
      }
    }

    if (
      dto.iRaypleLocationCode &&
      dto.iRaypleLocationCode !== existing.iRaypleLocationCode
    ) {
      const codeTaken =
        await this.productionLocationsRepository.existsByLocationCode(
          dto.iRaypleLocationCode,
          id,
        );
      if (codeTaken) {
        throw new BadRequestException('iRayple Location Code already in use');
      }
    }

    try {
      return await this.productionLocationsRepository.update(id, dto);
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
