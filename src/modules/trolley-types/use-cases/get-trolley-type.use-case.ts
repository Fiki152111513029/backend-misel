import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TROLLEY_TYPES_REPOSITORY } from '../repositories/trolley-type-repository.interface';
import type { ITrolleyTypesRepository } from '../repositories/trolley-type-repository.interface';

@Injectable()
export class GetTrolleyTypeUseCase {
  constructor(
    @Inject(TROLLEY_TYPES_REPOSITORY)
    private readonly trolleyTypesRepository: ITrolleyTypesRepository,
  ) {}

  async execute(id: string) {
    const trolleyType = await this.trolleyTypesRepository.findById(id);
    if (!trolleyType) {
      throw new NotFoundException('Trolley Type not found');
    }
    return trolleyType;
  }
}
