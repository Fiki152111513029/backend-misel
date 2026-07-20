import { Inject, Injectable } from '@nestjs/common';
import { BoxTypeQueryDto } from '../dto/box-type-query.dto';
import { BOX_TYPES_REPOSITORY } from '../repositories/box-type-repository.interface';
import type { IBoxTypesRepository } from '../repositories/box-type-repository.interface';

@Injectable()
export class GetBoxTypesUseCase {
  constructor(
    @Inject(BOX_TYPES_REPOSITORY)
    private readonly boxTypesRepository: IBoxTypesRepository,
  ) {}

  async execute(query: BoxTypeQueryDto) {
    const { items, total } = await this.boxTypesRepository.findAll(query);

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
