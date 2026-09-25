import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { UpdateRackDto } from '../dto/update-rack.dto';
import { RACKS_REPOSITORY } from '../repositories/rack-repository.interface';
import type { IRacksRepository } from '../repositories/rack-repository.interface';

@Injectable()
export class UpdateRackUseCase {
  constructor(
    @Inject(RACKS_REPOSITORY)
    private readonly racksRepository: IRacksRepository,
  ) {}

  async execute(id: string, dto: UpdateRackDto) {
    const existing = await this.racksRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rack not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.racksRepository.existsByName(dto.name, id);
      if (nameTaken) {
        throw new BadRequestException('Rack name already in use');
      }
    }

    try {
      return await this.racksRepository.update(id, dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException('Rack name already in use');
      }
      throw error;
    }
  }
}
