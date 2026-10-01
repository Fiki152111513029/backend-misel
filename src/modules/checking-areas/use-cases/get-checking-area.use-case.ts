import { Inject, Injectable } from '@nestjs/common';
import { FACTORY_MAPS_REPOSITORY } from '../../factory-maps/repositories/factory-map-repository.interface';
import type { IFactoryMapsRepository } from '../../factory-maps/repositories/factory-map-repository.interface';
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
}

@Injectable()
export class GetCheckingAreaUseCase {
  constructor(
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
    @Inject(FACTORY_MAPS_REPOSITORY)
    private readonly factoryMapsRepository: IFactoryMapsRepository,
    private readonly rcsStockStatusService: RcsStockStatusService,
  ) {}

  /**
   * `areaId` narrows the RCS lookup to one area. Omitted, every area a
   * Factory Map defines is asked and the answers merged — a Warehouse
   * Location records no area of its own, so without this the page would
   * make the operator guess which area their storage lives in before it
   * could tell them anything.
   */
  async execute(areaId?: number): Promise<CheckingAreaRow[]> {
    const areaIds = areaId != null ? [areaId] : await this.allAreaIds();

    const [{ items: locations }, statusByCode] = await Promise.all([
      this.warehouseLocationsRepository.findAll({
        page: 1,
        limit: 1000,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
      this.rcsStockStatusService.getStockStatusByCode(areaIds),
    ]);

    // Listed from our own Warehouse Locations rather than straight from the
    // RCS response, so the operator sees the names they know instead of bare
    // QR codes — and so a code RCS reports that we have no location for does
    // not show up as something they can "correct".
    return locations
      .filter((location) => !location.deletedAt && location.isActive)
      .map((location) => ({
        id: location.id,
        name: location.name,
        iRaypleLocationCode: location.iRaypleLocationCode,
        stockStatus: toBinStatus(
          statusByCode.get(location.iRaypleLocationCode),
        ),
      }));
  }

  private async allAreaIds(): Promise<number[]> {
    const { items: maps } = await this.factoryMapsRepository.findAll({
      page: 1,
      limit: 100,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    return maps
      .map((map) => map.areaNumber)
      .filter((areaNumber): areaNumber is number => areaNumber != null);
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
