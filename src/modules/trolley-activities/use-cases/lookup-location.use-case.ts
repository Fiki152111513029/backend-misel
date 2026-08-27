import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../../production-locations/repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../../production-locations/repositories/production-location-repository.interface';
import { TaskOrderService } from '../../tasks/services/task-order.service';
import { LookupLocationDto } from '../dto/lookup-location.dto';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';

// Second scan of the flow — resolves the scanned code against Warehouse
// Locations (Warehouse->Production direction: this becomes "pickup", the
// trolley's own fixed droppingLocationCode is the dropping point) or,
// failing that, Production Locations (Production->Warehouse direction: this
// becomes "pickup", dropping is auto-picked from whichever Warehouse
// Location is EMPTY — see CreateTrolleyActivityUseCase). Nothing is
// persisted here either way — this is a read-only lookup.
@Injectable()
export class LookupLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
    private readonly taskOrderService: TaskOrderService,
  ) {}

  async execute(dto: LookupLocationDto) {
    const warehouseLocation =
      await this.warehouseLocationsRepository.findActiveByLocationCode(
        dto.code,
      );
    if (warehouseLocation) {
      await this.assertNoInboundAmr(dto.code);
      return {
        pickupLocationCode: warehouseLocation.iRaypleLocationCode,
        pickupLocationName: warehouseLocation.name,
        pickupLocationSource: 'WAREHOUSE' as const,
      };
    }

    const productionLocation =
      await this.productionLocationsRepository.findActiveByLocationCode(
        dto.code,
      );
    if (productionLocation) {
      return {
        pickupLocationCode: productionLocation.iRaypleLocationCode,
        pickupLocationName: productionLocation.name,
        pickupLocationSource: 'PRODUCTION' as const,
      };
    }

    throw new BadRequestException(
      'Location not found for this code — must match an active Warehouse Location or Production Location',
    );
  }

  // Blocks confirming a Warehouse Trolley Task pickup on a node an AMR is
  // still physically en route to deliver something at. In practice this
  // only ever fires for a node currently reserved as a Production->
  // Warehouse activity's auto-picked destination (Warehouse->Production's
  // own dropping point is a Production Location, never scanned here) —
  // see findActiveTaskIdByLocationCode. Checked live against RCS's own
  // getTaskOrderStatus, not just our own DB status — a stuck PENDING row
  // whose webhook never arrived would otherwise block this node forever
  // (this is exactly the false-positive that got the old, DB-only version
  // of this check removed). Fails open: an RCS call that can't confirm the
  // AMR is still inbound (timeout, no data, or already reached) never
  // blocks the scan.
  private async assertNoInboundAmr(code: string): Promise<void> {
    const inboundTaskId =
      await this.trolleyActivitiesRepository.findActiveTaskIdByLocationCode(
        code,
      );
    if (!inboundTaskId) return;

    const progress =
      await this.taskOrderService.getTaskOrderStatus(inboundTaskId);
    const alreadyReached = progress.some((row) => row.qrContent === code);
    if (progress.length > 0 && !alreadyReached) {
      throw new BadRequestException(
        `An AMR is already on its way to deliver a trolley to ${code} — scan a different location, or wait for it to arrive`,
      );
    }
  }
}
