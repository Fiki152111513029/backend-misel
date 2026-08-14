import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TROLLEY_CATEGORIES_REPOSITORY } from '../repositories/trolley-category-repository.interface';
import type { ITrolleyCategoriesRepository } from '../repositories/trolley-category-repository.interface';

@Injectable()
export class DeleteTrolleyCategoryUseCase {
  constructor(
    @Inject(TROLLEY_CATEGORIES_REPOSITORY)
    private readonly trolleyCategoriesRepository: ITrolleyCategoriesRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.trolleyCategoriesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Trolley Category not found');
    }

    // Soft-deleting doesn't cascade to trolleys already assigned to this
    // category — the FK is ON DELETE SET NULL only for a hard delete, and
    // this is a soft delete, so existing trolleys just keep pointing at a
    // now-inactive category until reassigned. That's acceptable here since
    // Trolley reads don't filter by the category's own deletedAt.
    await this.trolleyCategoriesRepository.softDelete(id);
  }
}
