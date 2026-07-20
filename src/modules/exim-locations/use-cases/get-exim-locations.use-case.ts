import { Inject, Injectable } from '@nestjs/common';
import { EximLocationQueryDto } from '../dto/exim-location-query.dto';
import { EXIM_LOCATIONS_REPOSITORY } from '../repositories/exim-location-repository.interface';
import type { IEximLocationsRepository } from '../repositories/exim-location-repository.interface';

@Injectable()
export class GetEximLocationsUseCase {
  constructor(
    @Inject(EXIM_LOCATIONS_REPOSITORY)
    private readonly eximLocationsRepository: IEximLocationsRepository,
  ) {}

  async execute(query: EximLocationQueryDto) {
    const { items, total } = await this.eximLocationsRepository.findAll(query);

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
