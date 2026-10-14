import { BadRequestException } from '@nestjs/common';
import { NODE_STATUS_EMPTY } from '../../rcs-stock-status/rcs-stock-status.service';
import type { RcsStockStatusService } from '../../rcs-stock-status/rcs-stock-status.service';
import type { IFactoryMapsRepository } from '../../factory-maps/repositories/factory-map-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';

/**
 * Checks the pickup end of a Custom Task's route before it is dispatched.
 *
 *   first leg (pickup) must be FULL (2) — something has to be there to
 *                                         collect; empty means the robot
 *                                         would make the trip for nothing
 *
 * The drop end is deliberately NOT checked. A task dropping into a
 * warehouse node goes out whatever RCS says that node holds, full or not.
 * RCS's view of a drop bin is frequently behind the floor — a pallet
 * cleared minutes ago can still read as full — and refusing on that stale
 * reading stopped work that was perfectly fine to do. Where the load ends
 * up is settled when the robot arrives, not when the task is sent.
 *
 * Only the first leg is checked, and only when it is a Warehouse Location.
 * Legs in the middle are pass-through points the robot drives over, and
 * Production Locations are not tracked this way at all.
 *
 * Deliberately fails open: a code RCS says nothing about (unknown area, RCS
 * unreachable, node not registered there) does NOT block the task. RCS
 * going quiet must not stop the floor from working, so only an explicitly
 * wrong status is treated as a reason to refuse.
 */
export async function assertWarehouseBinsReady(
  deps: {
    warehouseLocationsRepository: IWarehouseLocationsRepository;
    factoryMapsRepository: IFactoryMapsRepository;
    rcsStockStatusService: RcsStockStatusService;
  },
  route: string[],
): Promise<void> {
  if (route.length === 0) return;

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

  const pickup = route[0];
  if (!warehouseCodes.has(pickup)) return;

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

  const status = byCode.get(pickup);
  if (status === undefined) return;

  if (String(status) === NODE_STATUS_EMPTY) {
    throw new BadRequestException(
      `Empty pallet not ready — ${pickup} is the pickup point, but RCS reports it as an empty bin (nodeStatus 0), so there is nothing to collect. Fill it on Checking Area, or load it on the floor, then send again.`,
    );
  }
}
