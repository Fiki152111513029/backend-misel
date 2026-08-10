import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CHARGER_AREAS_REPOSITORY } from '../repositories/charger-area-repository.interface';
import type { IChargerAreasRepository } from '../repositories/charger-area-repository.interface';

@Injectable()
export class DeleteChargerAreaUseCase {
  constructor(
    @Inject(CHARGER_AREAS_REPOSITORY)
    private readonly chargerAreasRepository: IChargerAreasRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.chargerAreasRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Charger Area not found');
    }

    await this.chargerAreasRepository.softDelete(id);
  }
}
