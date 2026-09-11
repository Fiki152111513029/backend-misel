import { Inject, Injectable } from '@nestjs/common';
import { TrolleyTypeQueryDto } from '../dto/trolley-type-query.dto';
import { TROLLEY_TYPES_REPOSITORY } from '../repositories/trolley-type-repository.interface';
import type { ITrolleyTypesRepository } from '../repositories/trolley-type-repository.interface';

@Injectable()
export class GetTrolleyTypesUseCase {
  constructor(
    @Inject(TROLLEY_TYPES_REPOSITORY)
    private readonly trolleyTypesRepository: ITrolleyTypesRepository,
  ) {}

  async execute(query: TrolleyTypeQueryDto) {
    const { items, total } = await this.trolleyTypesRepository.findAll(query);

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
