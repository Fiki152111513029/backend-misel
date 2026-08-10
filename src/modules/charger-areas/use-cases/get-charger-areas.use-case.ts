import { Inject, Injectable } from '@nestjs/common';
import { ChargerAreaQueryDto } from '../dto/charger-area-query.dto';
import { CHARGER_AREAS_REPOSITORY } from '../repositories/charger-area-repository.interface';
import type { IChargerAreasRepository } from '../repositories/charger-area-repository.interface';

@Injectable()
export class GetChargerAreasUseCase {
  constructor(
    @Inject(CHARGER_AREAS_REPOSITORY)
    private readonly chargerAreasRepository: IChargerAreasRepository,
  ) {}

  async execute(query: ChargerAreaQueryDto) {
    const { items, total } = await this.chargerAreasRepository.findAll(query);

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
