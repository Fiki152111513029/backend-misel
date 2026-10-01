import { BadRequestException } from '@nestjs/common';
import { NODE_STATUS_EMPTY } from '../../rcs-stock-status/rcs-stock-status.service';
import type { RcsStockStatusService } from '../../rcs-stock-status/rcs-stock-status.service';
import type { IFactoryMapsRepository } from '../../factory-maps/repositories/factory-map-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';

/**
 * Refuses to dispatch a Custom Task whose route passes through a Warehouse
 * Location that RCS reports as an empty bin (nodeStatus 0). The AMR goes
 * there to collect an empty pallet, so the bin has to be holding one —
 * nodeStatus 2 (full) is the ready state here, not the blocking one.
 * Sending the robot to a bin with nothing in it just produces a task that
 * fails on the floor.
 *
 * Only Warehouse Locations are checked — Production Locations and any other
 * node type on the route are left alone.
 *
 * Deliberately fails open: a code RCS says nothing about (unknown area, RCS
 * unreachable, node not registered there) does NOT block the task. RCS
 * going quiet must not stop the floor from working, so only an explicit
 * "this bin is empty" is treated as a reason to refuse.
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

  const unstocked = legs.filter(
    (code) => String(byCode.get(code)) === NODE_STATUS_EMPTY,
  );
  if (unstocked.length === 0) return;

  throw new BadRequestException(
    `Empty pallet not ready — ${unstocked.join(', ')} ${
      unstocked.length === 1 ? 'is' : 'are'
    } an empty bin in RCS (nodeStatus 0), so there is no pallet to collect. Fill it on Checking Area, or load it on the floor, then send again.`,
  );
}
