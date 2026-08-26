import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';

// Admin cleanup action for a row stuck PENDING/IN_PROGRESS forever — most
// often because its RCS completion webhook never arrived (see
// receive-task-status-webhook.use-case.ts), or because it's an open row
// (Take Trolley done, Drop Trolley never submitted for it). While stuck,
// it keeps showing as an in-flight task: the "AMR incoming" warning on the
// location scan step (findActiveIncomingByLocationCode) fires for anyone
// scanning the node its trolley.currentLocationCode points at, forever,
// even if nothing is really heading there. Marking it Failed here closes
// it out without pretending it actually completed.
@Injectable()
export class MarkTrolleyActivityFailedUseCase {
  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
  ) {}

  async execute(id: string) {
    const activity = await this.trolleyActivitiesRepository.findById(id);
    if (!activity) {
      throw new BadRequestException('Trolley activity not found');
    }
    if (
      activity.status === TaskStatus.COMPLETED ||
      activity.status === TaskStatus.FAILED
    ) {
      throw new BadRequestException(
        `This activity is already ${activity.status.toLowerCase()} — nothing to fix`,
      );
    }

    return this.trolleyActivitiesRepository.markFailedById(id);
  }
}
