import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TROLLEY_TYPES_REPOSITORY } from '../repositories/trolley-type-repository.interface';
import type { ITrolleyTypesRepository } from '../repositories/trolley-type-repository.interface';

@Injectable()
export class DeleteTrolleyTypeUseCase {
  constructor(
    @Inject(TROLLEY_TYPES_REPOSITORY)
    private readonly trolleyTypesRepository: ITrolleyTypesRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.trolleyTypesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Trolley Type not found');
    }

    await this.trolleyTypesRepository.softDelete(id);
  }
}
