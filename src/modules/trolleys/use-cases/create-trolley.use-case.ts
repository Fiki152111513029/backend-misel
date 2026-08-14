import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateTrolleyDto } from '../dto/create-trolley.dto';
import { TROLLEYS_REPOSITORY } from '../repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../repositories/trolley-repository.interface';

@Injectable()
export class CreateTrolleyUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
  ) {}

  async execute(dto: CreateTrolleyDto) {
    const nameTaken = await this.trolleysRepository.existsByName(dto.name);
    if (nameTaken) {
      throw new BadRequestException('Trolley name already in use');
    }

    const codeTaken = await this.trolleysRepository.existsByCode(dto.code);
    if (codeTaken) {
      throw new BadRequestException('Trolley code already in use');
    }

    if (dto.trolleyCategoryId) {
      const categoryExists =
        await this.trolleysRepository.existsActiveTrolleyCategoryById(
          dto.trolleyCategoryId,
        );
      if (!categoryExists) {
        throw new BadRequestException('Trolley Category not found');
      }
    }

    try {
      return await this.trolleysRepository.create(dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'A Trolley with this name or code is already in use',
        );
      }
      throw error;
    }
  }
}
