import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateTrolleyCategoryDto } from '../dto/create-trolley-category.dto';
import { TROLLEY_CATEGORIES_REPOSITORY } from '../repositories/trolley-category-repository.interface';
import type { ITrolleyCategoriesRepository } from '../repositories/trolley-category-repository.interface';

@Injectable()
export class CreateTrolleyCategoryUseCase {
  constructor(
    @Inject(TROLLEY_CATEGORIES_REPOSITORY)
    private readonly trolleyCategoriesRepository: ITrolleyCategoriesRepository,
  ) {}

  async execute(dto: CreateTrolleyCategoryDto) {
    const nameTaken = await this.trolleyCategoriesRepository.existsByName(
      dto.name,
    );
    if (nameTaken) {
      throw new BadRequestException('Trolley Category name already in use');
    }

    try {
      return await this.trolleyCategoriesRepository.create(dto);
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
