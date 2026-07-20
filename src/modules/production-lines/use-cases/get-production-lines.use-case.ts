import { Inject, Injectable } from '@nestjs/common';
import { ProductionLineQueryDto } from '../dto/production-line-query.dto';
import { PRODUCTION_LINES_REPOSITORY } from '../repositories/production-line-repository.interface';
import type { IProductionLinesRepository } from '../repositories/production-line-repository.interface';

@Injectable()
export class GetProductionLinesUseCase {
  constructor(
    @Inject(PRODUCTION_LINES_REPOSITORY)
    private readonly productionLinesRepository: IProductionLinesRepository,
  ) {}

  async execute(query: ProductionLineQueryDto) {
    const { items, total } =
      await this.productionLinesRepository.findAll(query);

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
