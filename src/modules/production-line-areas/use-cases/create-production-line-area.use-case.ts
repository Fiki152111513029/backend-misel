import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateProductionLineAreaDto } from '../dto/create-production-line-area.dto';
import { PRODUCTION_LINE_AREAS_REPOSITORY } from '../repositories/production-line-area-repository.interface';
import type { IProductionLineAreasRepository } from '../repositories/production-line-area-repository.interface';

@Injectable()
export class CreateProductionLineAreaUseCase {
  constructor(
    @Inject(PRODUCTION_LINE_AREAS_REPOSITORY)
    private readonly productionLineAreasRepository: IProductionLineAreasRepository,
  ) {}

  async execute(dto: CreateProductionLineAreaDto) {
    const codeTaken =
      await this.productionLineAreasRepository.existsByLocationCode(
        dto.iRaypleLocationCode,
      );
    if (codeTaken) {
      throw new BadRequestException('iRayple Location Code already in use');
    }

    const productionLineExists =
      await this.productionLineAreasRepository.existsActiveProductionLineById(
        dto.productionLineId,
      );
    if (!productionLineExists) {
      throw new BadRequestException('Production Line not found');
    }

    const eximLocationExists =
      await this.productionLineAreasRepository.existsActiveEximLocationById(
        dto.eximLocationId,
      );
    if (!eximLocationExists) {
      throw new BadRequestException('EXIM Location not found');
    }

    const emptyPalletLocationExists =
      await this.productionLineAreasRepository.existsActiveEmptyPalletLocationById(
        dto.emptyPalletLocationId,
      );
    if (!emptyPalletLocationExists) {
      throw new BadRequestException('Empty Pallet Location not found');
    }

    return this.productionLineAreasRepository.create(dto);
  }
}
