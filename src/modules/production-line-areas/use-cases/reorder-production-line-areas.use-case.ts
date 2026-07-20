import { Inject, Injectable } from '@nestjs/common';
import { ReorderProductionLineAreasDto } from '../dto/reorder-production-line-areas.dto';
import { PRODUCTION_LINE_AREAS_REPOSITORY } from '../repositories/production-line-area-repository.interface';
import type { IProductionLineAreasRepository } from '../repositories/production-line-area-repository.interface';

@Injectable()
export class ReorderProductionLineAreasUseCase {
  constructor(
    @Inject(PRODUCTION_LINE_AREAS_REPOSITORY)
    private readonly productionLineAreasRepository: IProductionLineAreasRepository,
  ) {}

  async execute(dto: ReorderProductionLineAreasDto) {
    await this.productionLineAreasRepository.reorderMany(dto.items);
  }
}
