import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PRODUCTION_LINES_REPOSITORY } from '../repositories/production-line-repository.interface';
import type { IProductionLinesRepository } from '../repositories/production-line-repository.interface';

@Injectable()
export class DeleteProductionLineUseCase {
  constructor(
    @Inject(PRODUCTION_LINES_REPOSITORY)
    private readonly productionLinesRepository: IProductionLinesRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.productionLinesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Production Line not found');
    }

    const hasActiveAreas =
      await this.productionLinesRepository.hasActiveAreas(id);
    if (hasActiveAreas) {
      throw new BadRequestException(
        'Cannot delete a Production Line that has Production Line Areas',
      );
    }

    const hasActiveRequestBoxes =
      await this.productionLinesRepository.hasActiveRequestBoxes(id);
    if (hasActiveRequestBoxes) {
      throw new BadRequestException(
        'Cannot delete a Production Line that has Request Boxes',
      );
    }

    await this.productionLinesRepository.softDelete(id);
  }
}
