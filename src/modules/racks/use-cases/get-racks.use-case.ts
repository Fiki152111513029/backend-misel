import { Inject, Injectable } from '@nestjs/common';
import { RackQueryDto } from '../dto/rack-query.dto';
import { RACKS_REPOSITORY } from '../repositories/rack-repository.interface';
import type { IRacksRepository } from '../repositories/rack-repository.interface';

@Injectable()
export class GetRacksUseCase {
  constructor(
    @Inject(RACKS_REPOSITORY)
    private readonly racksRepository: IRacksRepository,
  ) {}

  async execute(query: RackQueryDto) {
    const { items, total } = await this.racksRepository.findAll(query);

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
