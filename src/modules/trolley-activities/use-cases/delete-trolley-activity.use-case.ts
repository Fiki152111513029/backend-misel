import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';

@Injectable()
export class DeleteTrolleyActivityUseCase {
  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.trolleyActivitiesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Trolley Activity not found');
    }

    await this.trolleyActivitiesRepository.softDelete(id);
  }
}
