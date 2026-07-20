import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BOX_TYPES_REPOSITORY } from '../repositories/box-type-repository.interface';
import type { IBoxTypesRepository } from '../repositories/box-type-repository.interface';

@Injectable()
export class GetBoxTypeUseCase {
  constructor(
    @Inject(BOX_TYPES_REPOSITORY)
    private readonly boxTypesRepository: IBoxTypesRepository,
  ) {}

  async execute(id: string) {
    const boxType = await this.boxTypesRepository.findById(id);
    if (!boxType) {
      throw new NotFoundException('Box Type not found');
    }
    return boxType;
  }
}
