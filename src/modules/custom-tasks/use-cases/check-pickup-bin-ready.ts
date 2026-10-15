import { NODE_STATUS_EMPTY } from '../../rcs-stock-status/rcs-stock-status.service';
import type { RcsStockStatusService } from '../../rcs-stock-status/rcs-stock-status.service';
import type { IFactoryMapsRepository } from '../../factory-maps/repositories/factory-map-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';

/**
 * Reports whether the pickup end of a Custom Task's route is ready.
 *
 *   first leg (pickup) must be FULL (2) — something has to be there to
 *                                         collect; empty means the robot
 *                                         would make the trip for nothing
 *
 * Reports rather than refuses. An empty pickup bin used to reject the send
 * outright, which meant the operator had to stand by and keep retrying
 * until the rack was filled. Now the caller holds the task instead and a
 * watcher dispatches it once the bin fills, so this returns a verdict and
 * lets the caller decide what to do with it.
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
 * unreachable, node not registered there) counts as ready. RCS going quiet
 * must not stop the floor from working, so only an explicitly empty bin is
 * treated as a reason to hold the task back.
 */
export type PickupBinVerdict =
  /** Send it now. */
  | { ready: true }
  /** Hold it: this pickup code is an empty bin in RCS right now. */
  | { ready: false; code: string };

export async function checkPickupBinReady(
  deps: {
    warehouseLocationsRepository: IWarehouseLocationsRepository;
    factoryMapsRepository: IFactoryMapsRepository;
    rcsStockStatusService: RcsStockStatusService;
  },
  route: string[],
): Promise<PickupBinVerdict> {
  if (route.length === 0) return { ready: true };

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
  if (!warehouseCodes.has(pickup)) return { ready: true };

  const { items: maps } = await deps.factoryMapsRepository.findAll({
    page: 1,
    limit: 100,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const areaIds = maps
    .map((map) => map.areaNumber)
    .filter((areaNumber): areaNumber is number => areaNumber != null);
  if (areaIds.length === 0) return { ready: true };

  const byCode = await deps.rcsStockStatusService.getStockStatusByCode(areaIds);

  const status = byCode.get(pickup);
  if (status === undefined) return { ready: true };

  if (String(status) === NODE_STATUS_EMPTY) {
    return { ready: false, code: pickup };
  }

  return { ready: true };
}
