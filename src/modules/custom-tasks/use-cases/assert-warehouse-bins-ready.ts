import { BadRequestException } from '@nestjs/common';
import { NODE_STATUS_FULL } from '../../rcs-stock-status/rcs-stock-status.service';
import type { RcsStockStatusService } from '../../rcs-stock-status/rcs-stock-status.service';
import type { IFactoryMapsRepository } from '../../factory-maps/repositories/factory-map-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';

/**
 * Refuses to dispatch a Custom Task whose route passes through a Warehouse
 * Location that RCS still reports as a full bin (nodeStatus 2). The AMR
 * expects to find an empty pallet slot there; sending it to an occupied one
 * just produces a task that fails on the floor.
 *
 * Only Warehouse Locations are checked — Production Locations and any other
 * node type on the route are left alone.
 *
 * Deliberately fails open: a code RCS says nothing about (unknown area, RCS
 * unreachable, node not registered there) does NOT block the task. RCS
 * going quiet must not stop the floor from working, so only an explicit
 * "this bin is full" is treated as a reason to refuse.
 */
export async function assertWarehouseBinsReady(
  deps: {
    warehouseLocationsRepository: IWarehouseLocationsRepository;
    factoryMapsRepository: IFactoryMapsRepository;
    rcsStockStatusService: RcsStockStatusService;
  },
  route: string[],
): Promise<void> {
  const { items: warehouseLocations } =
    await deps.warehouseLocationsRepository.findAll({
      page: 1,
      limit: 1000,
      sortBy: 'name',
      sortOrder: 'asc',
    });

  const warehouseCodes = new Set(
    warehouseLocations
      .filter((location) => location.isActive && !location.deletedAt)
      .map((location) => location.iRaypleLocationCode),
  );

  // A route may revisit the same leg; each distinct code only needs one check.
  const legs = [...new Set(route.filter((code) => warehouseCodes.has(code)))];
  if (legs.length === 0) return;

  const { items: maps } = await deps.factoryMapsRepository.findAll({
    page: 1,
    limit: 100,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const areaIds = maps
    .map((map) => map.areaNumber)
    .filter((areaNumber): areaNumber is number => areaNumber != null);
  if (areaIds.length === 0) return;

  const byCode = await deps.rcsStockStatusService.getStockStatusByCode(areaIds);

  const occupied = legs.filter(
    (code) => String(byCode.get(code)) === NODE_STATUS_FULL,
  );
  if (occupied.length === 0) return;

  throw new BadRequestException(
    `Empty pallet not ready — ${occupied.join(', ')} ${
      occupied.length === 1 ? 'is' : 'are'
    } still a full bin in RCS (nodeStatus 2). Empty it on Checking Area, or clear it on the floor, then send again.`,
  );
}
