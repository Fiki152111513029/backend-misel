import { Inject, Injectable } from '@nestjs/common';
import { ProductionLineAreaQueryDto } from '../dto/production-line-area-query.dto';
import { PRODUCTION_LINE_AREAS_REPOSITORY } from '../repositories/production-line-area-repository.interface';
import type { IProductionLineAreasRepository } from '../repositories/production-line-area-repository.interface';

@Injectable()
export class GetProductionLineAreasUseCase {
  constructor(
    @Inject(PRODUCTION_LINE_AREAS_REPOSITORY)
    private readonly productionLineAreasRepository: IProductionLineAreasRepository,
  ) {}

  async execute(query: ProductionLineAreaQueryDto) {
    const { items, total } =
      await this.productionLineAreasRepository.findAll(query);

    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
