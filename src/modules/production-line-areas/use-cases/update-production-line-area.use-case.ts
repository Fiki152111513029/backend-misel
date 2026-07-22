import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateProductionLineAreaDto } from '../dto/update-production-line-area.dto';
import { PRODUCTION_LINE_AREAS_REPOSITORY } from '../repositories/production-line-area-repository.interface';
import type { IProductionLineAreasRepository } from '../repositories/production-line-area-repository.interface';

@Injectable()
export class UpdateProductionLineAreaUseCase {
  constructor(
    @Inject(PRODUCTION_LINE_AREAS_REPOSITORY)
    private readonly productionLineAreasRepository: IProductionLineAreasRepository,
  ) {}

  async execute(id: string, dto: UpdateProductionLineAreaDto) {
    const existing = await this.productionLineAreasRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Production Line Area not found');
    }

    if (
      dto.iRaypleLocationCode &&
      dto.iRaypleLocationCode !== existing.iRaypleLocationCode
    ) {
      const codeTaken =
        await this.productionLineAreasRepository.existsByLocationCode(
          dto.iRaypleLocationCode,
          id,
        );
      if (codeTaken) {
        throw new BadRequestException('iRayple Location Code already in use');
      }
    }

    if (
      dto.productionLineId &&
      dto.productionLineId !== existing.productionLineId
    ) {
      const productionLineExists =
        await this.productionLineAreasRepository.existsActiveProductionLineById(
          dto.productionLineId,
        );
      if (!productionLineExists) {
        throw new BadRequestException('Production Line not found');
      }
    }

    if (dto.eximLocationId && dto.eximLocationId !== existing.eximLocationId) {
      const eximLocationExists =
        await this.productionLineAreasRepository.existsActiveEximLocationById(
          dto.eximLocationId,
        );
      if (!eximLocationExists) {
        throw new BadRequestException('EXIM Location not found');
      }
    }

    if (
      dto.emptyPalletLocationId &&
      dto.emptyPalletLocationId !== existing.emptyPalletLocationId
    ) {
      const emptyPalletLocationExists =
        await this.productionLineAreasRepository.existsActiveEmptyPalletLocationById(
          dto.emptyPalletLocationId,
        );
      if (!emptyPalletLocationExists) {
        throw new BadRequestException('Empty Pallet Location not found');
      }
    }

    if (
      dto.modelCodeProcessId &&
      dto.modelCodeProcessId !== existing.modelCodeProcessId
    ) {
      const modelCodeProcessExists =
        await this.productionLineAreasRepository.existsActiveModelCodeProcessById(
          dto.modelCodeProcessId,
        );
      if (!modelCodeProcessExists) {
        throw new BadRequestException('Model Code Process not found');
      }
    }

    return this.productionLineAreasRepository.update(id, dto);
  }
}
