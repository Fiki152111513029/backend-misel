import { Inject, Injectable } from '@nestjs/common';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';

// Powers the Factory Map's robot marker: while a robot has a Trolley Task
// in flight (PENDING/IN_PROGRESS), it shows a "carrying empty/full trolley"
// icon instead of its usual Idle/Charging one.
@Injectable()
export class GetActiveTrolleyActivitiesByRobotUseCase {
  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
  ) {}

  execute() {
    return this.trolleyActivitiesRepository.findActiveByRobot();
  }
}
