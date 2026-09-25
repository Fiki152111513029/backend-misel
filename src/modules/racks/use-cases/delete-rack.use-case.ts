import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RACKS_REPOSITORY } from '../repositories/rack-repository.interface';
import type { IRacksRepository } from '../repositories/rack-repository.interface';

@Injectable()
export class DeleteRackUseCase {
  constructor(
    @Inject(RACKS_REPOSITORY)
    private readonly racksRepository: IRacksRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.racksRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Rack not found');
    }

    await this.racksRepository.softDelete(id);
  }
}
