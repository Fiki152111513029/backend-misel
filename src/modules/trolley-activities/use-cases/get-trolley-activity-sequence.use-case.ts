import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';

// "No urut" — this activity's position among everything its own user has
// ever submitted, ordered by creation time (mirrors GetTaskSequenceUseCase).
@Injectable()
export class GetTrolleyActivitySequenceUseCase {
  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
  ) {}

  async execute(id: string) {
    const activity = await this.trolleyActivitiesRepository.findById(id);
    if (!activity) {
      throw new NotFoundException('Trolley Activity not found');
    }
    const sequenceNumber = await this.trolleyActivitiesRepository.countByUserUpTo(
      activity.userId,
      activity.createdAt,
    );
    return { sequenceNumber };
  }
}
