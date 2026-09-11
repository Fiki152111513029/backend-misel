import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateTrolleyTypeDto } from '../dto/create-trolley-type.dto';
import { TROLLEY_TYPES_REPOSITORY } from '../repositories/trolley-type-repository.interface';
import type { ITrolleyTypesRepository } from '../repositories/trolley-type-repository.interface';

@Injectable()
export class CreateTrolleyTypeUseCase {
  constructor(
    @Inject(TROLLEY_TYPES_REPOSITORY)
    private readonly trolleyTypesRepository: ITrolleyTypesRepository,
  ) {}

  async execute(dto: CreateTrolleyTypeDto) {
    const nameTaken = await this.trolleyTypesRepository.existsByName(dto.name);
    if (nameTaken) {
      throw new BadRequestException('Trolley Type name already in use');
    }

    try {
      return await this.trolleyTypesRepository.create(dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException('Trolley Type name already in use');
      }
      throw error;
    }
  }
}
