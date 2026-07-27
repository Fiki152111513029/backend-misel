import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateBoxTypeDto } from '../dto/create-box-type.dto';
import { BOX_TYPES_REPOSITORY } from '../repositories/box-type-repository.interface';
import type { IBoxTypesRepository } from '../repositories/box-type-repository.interface';

@Injectable()
export class CreateBoxTypeUseCase {
  constructor(
    @Inject(BOX_TYPES_REPOSITORY)
    private readonly boxTypesRepository: IBoxTypesRepository,
  ) {}

  async execute(dto: CreateBoxTypeDto) {
    const nameTaken = await this.boxTypesRepository.existsByName(dto.name);
    if (nameTaken) {
      throw new BadRequestException('Box Type name already in use');
    }

    const orderingTaken = await this.boxTypesRepository.existsByOrdering(
      dto.ordering,
    );
    if (orderingTaken) {
      throw new BadRequestException('Box Type ordering already in use');
    }

    try {
      return await this.boxTypesRepository.create(dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException('Box Type name already in use');
      }
      throw error;
    }
  }
}
