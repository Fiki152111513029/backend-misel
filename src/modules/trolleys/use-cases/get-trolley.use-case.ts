import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TROLLEYS_REPOSITORY } from '../repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../repositories/trolley-repository.interface';

@Injectable()
export class GetTrolleyUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
  ) {}

  async execute(id: string) {
    const trolley = await this.trolleysRepository.findById(id);
    if (!trolley) {
      throw new NotFoundException('Trolley not found');
    }
    return trolley;
  }
}
