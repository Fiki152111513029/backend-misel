import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RACKS_REPOSITORY } from '../repositories/rack-repository.interface';
import type { IRacksRepository } from '../repositories/rack-repository.interface';

@Injectable()
export class GetRackUseCase {
  constructor(
    @Inject(RACKS_REPOSITORY)
    private readonly racksRepository: IRacksRepository,
  ) {}

  async execute(id: string) {
    const rack = await this.racksRepository.findById(id);
    if (!rack) {
      throw new NotFoundException('Rack not found');
    }
    return rack;
  }
}
