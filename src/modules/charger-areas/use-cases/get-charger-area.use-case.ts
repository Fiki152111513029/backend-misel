import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CHARGER_AREAS_REPOSITORY } from '../repositories/charger-area-repository.interface';
import type { IChargerAreasRepository } from '../repositories/charger-area-repository.interface';

@Injectable()
export class GetChargerAreaUseCase {
  constructor(
    @Inject(CHARGER_AREAS_REPOSITORY)
    private readonly chargerAreasRepository: IChargerAreasRepository,
  ) {}

  async execute(id: string) {
    const chargerArea = await this.chargerAreasRepository.findById(id);
    if (!chargerArea) {
      throw new NotFoundException('Charger Area not found');
    }
    return chargerArea;
  }
}
