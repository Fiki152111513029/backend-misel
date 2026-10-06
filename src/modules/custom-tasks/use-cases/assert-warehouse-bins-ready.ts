import { BadRequestException } from '@nestjs/common';
import {
  NODE_STATUS_EMPTY,
  NODE_STATUS_FULL,
} from '../../rcs-stock-status/rcs-stock-status.service';
import type { RcsStockStatusService } from '../../rcs-stock-status/rcs-stock-status.service';
import type { IFactoryMapsRepository } from '../../factory-maps/repositories/factory-map-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';

/**
 * Checks the two ends of a Custom Task's route before it is dispatched.
 * What a Warehouse Location has to hold depends on which end it sits at —
 * one rule for the whole route can only ever be right for half the cases:
 *
 *   first leg (pickup) must be FULL (2)  — something has to be there to
 *                                          collect; empty means nothing
 *                                          to pick up
 *   last leg  (drop)   must be EMPTY (0) — the slot has to be free; full
 *                                          means nowhere to put the load
 *
 * Example: "WRL12, PT2A, …" needs WRL12 full. "PT2A, …, WRL12" needs WRL12
 * empty. The same node, opposite requirements, decided purely by position.
 *
 * Only those two ends are checked, and only when that end is a Warehouse
 * Location. Legs in the middle are pass-through points the robot drives
 * over, and Production Locations are not tracked this way at all.
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
  const drop = route[route.length - 1];

  // A round trip that collects from a node and returns to it — "WRL12, …,
  // WRL12" — is one node wearing both hats. Only the pickup can be checked
  // at dispatch: it has to be full now, and it will have been emptied by
  // the time the robot comes back. Demanding both would make such a route
  // impossible to send, whatever the bin holds. A one-leg route is the same
  // case, since a route that only drops has nowhere to have collected from.
  const checks: { code: string; role: 'pickup' | 'drop' }[] = [];
  if (warehouseCodes.has(pickup)) checks.push({ code: pickup, role: 'pickup' });
  if (drop !== pickup && warehouseCodes.has(drop)) {
    checks.push({ code: drop, role: 'drop' });
  }
  if (checks.length === 0) return;

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

  for (const { code, role } of checks) {
    const status = byCode.get(code);
    if (status === undefined) continue;

    if (role === 'pickup' && String(status) === NODE_STATUS_EMPTY) {
      throw new BadRequestException(
        `Empty pallet not ready — ${code} is the pickup point, but RCS reports it as an empty bin (nodeStatus 0), so there is nothing to collect. Fill it on Checking Area, or load it on the floor, then send again.`,
      );
    }

    if (role === 'drop' && String(status) === NODE_STATUS_FULL) {
      throw new BadRequestException(
        `Drop location not free — ${code} is the drop point, but RCS reports it as a full bin (nodeStatus 2), so there is nowhere to put the load. Empty it on Checking Area, or clear it on the floor, then send again.`,
      );
    }
  }
}
