import { Inject, Injectable } from '@nestjs/common';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';

// Restores the logged-in user's own in-flight Trolley Tasks (PENDING/
// IN_PROGRESS) after a page reload, since the Current Queue cards
// themselves only live in the frontend's Pinia store. Each activity is
// tagged with which page (Warehouse or Operator Trolley Task) it was
// actually submitted from — pickupSource here reflects that stored
// queueRole, NOT the pickup/dropping direction the submission turned out to
// be (an operator can submit a Production-direction pickup while standing
// on the Warehouse page, and the Current Queue card must still follow the
// page they used, not the direction). Rows written before queueRole
// existed have no way to know it in hindsight, so those fall back to the
// old direction-based guess.
@Injectable()
export class GetMyActiveTrolleyActivitiesUseCase {
  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
  ) {}

  async execute(userId: string) {
    const activities =
      await this.trolleyActivitiesRepository.findActiveByUser(userId);

    return Promise.all(
      activities.map(async (activity) => {
        const pickupSource = await this.resolvePickupSource(activity);
        return {
          activityId: activity.id,
          taskId: activity.taskId,
          trolleyCode: activity.trolley.code,
          trolleyName: activity.trolley.name,
          pickupSource,
        };
      }),
    );
  }

  private async resolvePickupSource(activity: {
    queueRole: string | null;
    pickupLocationCode: string;
  }): Promise<'WAREHOUSE' | 'PRODUCTION'> {
    if (activity.queueRole === 'Warehouse') return 'WAREHOUSE';
    if (activity.queueRole === 'Operator') return 'PRODUCTION';

    const pickupWarehouseLocation =
      await this.warehouseLocationsRepository.findActiveByLocationCode(
        activity.pickupLocationCode,
      );
    return pickupWarehouseLocation ? 'WAREHOUSE' : 'PRODUCTION';
  }
}
