import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRODUCTION_LINE_AREAS_REPOSITORY } from '../repositories/production-line-area-repository.interface';
import type { IProductionLineAreasRepository } from '../repositories/production-line-area-repository.interface';

@Injectable()
export class GetProductionLineAreaUseCase {
  constructor(
    @Inject(PRODUCTION_LINE_AREAS_REPOSITORY)
    private readonly productionLineAreasRepository: IProductionLineAreasRepository,
  ) {}

  async execute(id: string) {
    const productionLineArea =
      await this.productionLineAreasRepository.findById(id);
    if (!productionLineArea) {
      throw new NotFoundException('Production Line Area not found');
    }
    return productionLineArea;
  }
}
