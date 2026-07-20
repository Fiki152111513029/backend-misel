import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BOX_TYPES_REPOSITORY } from '../repositories/box-type-repository.interface';
import type { IBoxTypesRepository } from '../repositories/box-type-repository.interface';

@Injectable()
export class DeleteBoxTypeUseCase {
  constructor(
    @Inject(BOX_TYPES_REPOSITORY)
    private readonly boxTypesRepository: IBoxTypesRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.boxTypesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Box Type not found');
    }

    const hasActiveRequestBoxes =
      await this.boxTypesRepository.hasActiveRequestBoxes(id);
    if (hasActiveRequestBoxes) {
      throw new BadRequestException(
        'Cannot delete a Box Type that has Request Boxes',
      );
    }

    await this.boxTypesRepository.softDelete(id);
  }
}
