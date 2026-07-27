import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
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

    if (dto.modelCodeProcessId) {
      const modelCodeProcessExists =
        await this.productionLineAreasRepository.existsActiveModelCodeProcessById(
          dto.modelCodeProcessId,
        );
      if (!modelCodeProcessExists) {
        throw new BadRequestException('Model Code Process not found');
      }
    }

    try {
      return await this.productionLineAreasRepository.create(dto);
    } catch (error) {
      // Safety net for a rare concurrent-create race — the pre-check above
      // already covers the common case.
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException('iRayple Location Code already in use');
      }
      throw error;
    }
  }
}
