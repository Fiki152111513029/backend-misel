import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { UpdateTrolleyCategoryDto } from '../dto/update-trolley-category.dto';
import { TROLLEY_CATEGORIES_REPOSITORY } from '../repositories/trolley-category-repository.interface';
import type { ITrolleyCategoriesRepository } from '../repositories/trolley-category-repository.interface';

@Injectable()
export class UpdateTrolleyCategoryUseCase {
  constructor(
    @Inject(TROLLEY_CATEGORIES_REPOSITORY)
    private readonly trolleyCategoriesRepository: ITrolleyCategoriesRepository,
  ) {}

  async execute(id: string, dto: UpdateTrolleyCategoryDto) {
    const existing = await this.trolleyCategoriesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Trolley Category not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.trolleyCategoriesRepository.existsByName(
        dto.name,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException('Trolley Category name already in use');
      }
    }

    try {
      return await this.trolleyCategoriesRepository.update(id, dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'A Trolley Category with this name is already in use',
        );
      }
      throw error;
    }
  }
}
