import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateBoxTypeDto } from '../dto/update-box-type.dto';
import { BOX_TYPES_REPOSITORY } from '../repositories/box-type-repository.interface';
import type { IBoxTypesRepository } from '../repositories/box-type-repository.interface';

@Injectable()
export class UpdateBoxTypeUseCase {
  constructor(
    @Inject(BOX_TYPES_REPOSITORY)
    private readonly boxTypesRepository: IBoxTypesRepository,
  ) {}

  async execute(id: string, dto: UpdateBoxTypeDto) {
    const existing = await this.boxTypesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Box Type not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.boxTypesRepository.existsByName(
        dto.name,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException('Box Type name already in use');
      }
    }

    if (dto.ordering !== undefined && dto.ordering !== existing.ordering) {
      const orderingTaken = await this.boxTypesRepository.existsByOrdering(
        dto.ordering,
        id,
      );
      if (orderingTaken) {
        throw new BadRequestException('Box Type ordering already in use');
      }
    }

    return this.boxTypesRepository.update(id, dto);
  }
}
