import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { UpdateTrolleyTypeDto } from '../dto/update-trolley-type.dto';
import { TROLLEY_TYPES_REPOSITORY } from '../repositories/trolley-type-repository.interface';
import type { ITrolleyTypesRepository } from '../repositories/trolley-type-repository.interface';

@Injectable()
export class UpdateTrolleyTypeUseCase {
  constructor(
    @Inject(TROLLEY_TYPES_REPOSITORY)
    private readonly trolleyTypesRepository: ITrolleyTypesRepository,
  ) {}

  async execute(id: string, dto: UpdateTrolleyTypeDto) {
    const existing = await this.trolleyTypesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Trolley Type not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.trolleyTypesRepository.existsByName(
        dto.name,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException('Trolley Type name already in use');
      }
    }

    try {
      return await this.trolleyTypesRepository.update(id, dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException('Trolley Type name already in use');
      }
      throw error;
    }
  }
}
