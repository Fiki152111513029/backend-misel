import { Inject, Injectable } from '@nestjs/common';
import {
  NODE_STATUS_EMPTY,
  NODE_STATUS_FULL,
  RcsStockStatusService,
} from '../../rcs-stock-status/rcs-stock-status.service';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';

export type BinStatus = 'EMPTY' | 'FULL';

export interface CheckingAreaRow {
  id: string;
  name: string;
  iRaypleLocationCode: string;
  /**
   * What RCS currently believes. Null when RCS reported nothing for this
   * code — either the node is not in the chosen area, or RCS has never been
   * told about it. Shown as "Unknown" rather than guessed at, since guessing
   * is exactly what this page exists to correct.
   */
  stockStatus: BinStatus | null;
  /** RCS says a task is currently using this node. */
  inTask: boolean;
}

@Injectable()
export class GetCheckingAreaUseCase {
  constructor(
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
    private readonly rcsStockStatusService: RcsStockStatusService,
  ) {}

  async execute(areaId: number): Promise<CheckingAreaRow[]> {
    const [{ items: locations }, rcsRows] = await Promise.all([
      this.warehouseLocationsRepository.findAll({
        page: 1,
        limit: 1000,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
      this.rcsStockStatusService.getStockStatus(areaId),
    ]);

    const byCode = new Map(rcsRows.map((row) => [row.qrContent, row]));

    // Listed from our own Warehouse Locations rather than straight from the
    // RCS response, so the operator sees the names they know instead of bare
    // QR codes — and so a code RCS reports that we have no location for does
    // not show up as something they can "correct".
    return locations
      .filter((location) => !location.deletedAt && location.isActive)
      .map((location) => {
        const row = byCode.get(location.iRaypleLocationCode);
        return {
          id: location.id,
          name: location.name,
          iRaypleLocationCode: location.iRaypleLocationCode,
          stockStatus: toBinStatus(row?.stockStatus),
          inTask: row?.inTask === '1' || row?.inTask === 'true',
        };
      });
  }
}

// RCS codes its bins as 0 = empty, 2 = full (see NodeStatus). Anything else
// is left unknown rather than folded into one of the two.
function toBinStatus(value: number | undefined): BinStatus | null {
  if (value === undefined) return null;
  if (String(value) === NODE_STATUS_EMPTY) return 'EMPTY';
  if (String(value) === NODE_STATUS_FULL) return 'FULL';
  return null;
}
