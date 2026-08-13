import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TROLLEYS_REPOSITORY } from '../repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../repositories/trolley-repository.interface';

@Injectable()
export class DeleteTrolleyUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.trolleysRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Trolley not found');
    }

    await this.trolleysRepository.softDelete(id);
  }
}
