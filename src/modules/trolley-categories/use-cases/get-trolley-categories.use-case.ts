import { Inject, Injectable } from '@nestjs/common';
import { TrolleyCategoryQueryDto } from '../dto/trolley-category-query.dto';
import { TROLLEY_CATEGORIES_REPOSITORY } from '../repositories/trolley-category-repository.interface';
import type { ITrolleyCategoriesRepository } from '../repositories/trolley-category-repository.interface';

@Injectable()
export class GetTrolleyCategoriesUseCase {
  constructor(
    @Inject(TROLLEY_CATEGORIES_REPOSITORY)
    private readonly trolleyCategoriesRepository: ITrolleyCategoriesRepository,
  ) {}

  async execute(query: TrolleyCategoryQueryDto) {
    const { items, total } =
      await this.trolleyCategoriesRepository.findAll(query);

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
