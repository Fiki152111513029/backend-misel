import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TROLLEY_CATEGORIES_REPOSITORY } from '../repositories/trolley-category-repository.interface';
import type { ITrolleyCategoriesRepository } from '../repositories/trolley-category-repository.interface';

@Injectable()
export class GetTrolleyCategoryUseCase {
  constructor(
    @Inject(TROLLEY_CATEGORIES_REPOSITORY)
    private readonly trolleyCategoriesRepository: ITrolleyCategoriesRepository,
  ) {}

  async execute(id: string) {
    const trolleyCategory =
      await this.trolleyCategoriesRepository.findById(id);
    if (!trolleyCategory) {
      throw new NotFoundException('Trolley Category not found');
    }
    return trolleyCategory;
  }
}
