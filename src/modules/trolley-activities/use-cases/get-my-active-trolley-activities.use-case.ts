import { Inject, Injectable } from '@nestjs/common';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';

// Restores the logged-in user's own in-flight Trolley Tasks (PENDING/
// IN_PROGRESS) after a page reload, since the Current Queue cards
// themselves only live in the frontend's Pinia store. Each activity is
// tagged with which direction its pickup was — the Warehouse/Operator
// Trolley Task page uses that to only restore into its own queue and not
// the other page's, the same split CreateTrolleyActivityUseCase already
// derives at submit time.
@Injectable()
export class GetMyActiveTrolleyActivitiesUseCase {
  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
  ) {}

  async execute(userId: string) {
    const activities = await this.trolleyActivitiesRepository.findActiveByUser(userId);

    return Promise.all(
      activities.map(async (activity) => {
        const pickupWarehouseLocation =
          await this.warehouseLocationsRepository.findActiveByLocationCode(
            activity.pickupLocationCode,
          );
        return {
          activityId: activity.id,
          taskId: activity.taskId,
          trolleyCode: activity.trolley.code,
          trolleyName: activity.trolley.name,
          pickupSource: pickupWarehouseLocation
            ? ('WAREHOUSE' as const)
            : ('PRODUCTION' as const),
        };
      }),
    );
  }
}
