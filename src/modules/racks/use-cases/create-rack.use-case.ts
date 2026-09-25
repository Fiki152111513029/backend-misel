import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateRackDto } from '../dto/create-rack.dto';
import { RACKS_REPOSITORY } from '../repositories/rack-repository.interface';
import type { IRacksRepository } from '../repositories/rack-repository.interface';

@Injectable()
export class CreateRackUseCase {
  constructor(
    @Inject(RACKS_REPOSITORY)
    private readonly racksRepository: IRacksRepository,
  ) {}

  async execute(dto: CreateRackDto) {
    const nameTaken = await this.racksRepository.existsByName(dto.name);
    if (nameTaken) {
      throw new BadRequestException('Rack name already in use');
    }

    try {
      return await this.racksRepository.create(dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException('Rack name already in use');
      }
      throw error;
    }
  }
}
