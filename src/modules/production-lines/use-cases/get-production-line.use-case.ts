import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PRODUCTION_LINES_REPOSITORY } from '../repositories/production-line-repository.interface';
import type { IProductionLinesRepository } from '../repositories/production-line-repository.interface';

@Injectable()
export class GetProductionLineUseCase {
  constructor(
    @Inject(PRODUCTION_LINES_REPOSITORY)
    private readonly productionLinesRepository: IProductionLinesRepository,
  ) {}

  async execute(id: string) {
    const productionLine = await this.productionLinesRepository.findById(id);
    if (!productionLine) {
      throw new NotFoundException('Production Line not found');
    }
    return productionLine;
  }
}
