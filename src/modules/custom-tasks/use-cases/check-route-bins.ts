import {
  NODE_STATUS_EMPTY,
  NODE_STATUS_FULL,
} from '../../rcs-stock-status/rcs-stock-status.service';
import type { RcsStockStatusService } from '../../rcs-stock-status/rcs-stock-status.service';
import type { IFactoryMapsRepository } from '../../factory-maps/repositories/factory-map-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';

/**
 * Whether both ends of a Custom Task's route are ready for it to run.
 *
 *   first leg (pickup) must be FULL (2)  — something has to be there to
 *                                          collect
 *   last leg  (drop)   must be EMPTY (0) — the slot has to be free to put
 *                                          the load down
 *
 * Only checked when that end is a Warehouse Location. Legs in the middle
 * are pass-through points the robot drives over, and Production Locations
 * are not tracked this way at all.
 *
 * Reports rather than refuses. Either end being wrong used to reject the
 * send outright, leaving the operator to stand there retrying; now the
 * caller parks the task and CustomTaskBinWatcherService releases it once
 * the condition is met.
 *
 * Deliberately fails open: a code RCS says nothing about (unknown area,
 * RCS unreachable, node not registered there) counts as ready. RCS going
 * quiet must not stop the floor from working.
 */
export type RouteBinVerdict =
  /** Send it now. */
  | { ready: true }
  /** Hold it until `code` reports `needStatus`. */
  | {
      ready: false;
      code: string;
      /** The RCS nodeStatus that would release it: '2' full, '0' empty. */
      needStatus: string;
      role: 'pickup' | 'drop';
    };

export interface RouteBinContext {
  /** iRaypleLocationCodes that are active Warehouse Locations. */
  warehouseCodes: Set<string>;
  /** Latest nodeStatus per location code, as RCS reported it. */
  byCode: Map<string, string | number>;
  /**
   * Codes holding finished goods.
   *
   * RCS reports these as 0 on purpose — its 2 means "empty rack ready to
   * collect", which finished goods are not. But the node is physically
   * occupied, so a drop must still wait: without this, a task would be
   * sent to put a second rack where one already stands.
   */
  finishGoodCodes: Set<string>;
}

/**
 * The rule itself, with the lookups already done.
 *
 * Split out so the watcher can evaluate every parked task against a single
 * fetch of warehouse codes and bin statuses, instead of repeating both per
 * task — and so this half can be tested without any of them.
 */
export interface EvaluateOptions {
  /**
   * Treat "RCS said nothing about this code" as not-ready instead of ready.
   *
   * The two callers need opposite answers to the same silence. Sending a
   * new task fails OPEN — RCS going quiet must not stop the floor working.
   * Releasing a task already parked fails CLOSED: it was held because a bin
   * was wrong, and silence is not evidence that it has been put right, so
   * letting it go would send a robot on the trip the hold was preventing.
   */
  requireKnown?: boolean;
}

export function evaluateRouteBins(
  route: string[],
  { warehouseCodes, byCode, finishGoodCodes }: RouteBinContext,
  { requireKnown = false }: EvaluateOptions = {},
): RouteBinVerdict {
  if (route.length === 0) return { ready: true };

  const pickup = route[0];
  const drop = route[route.length - 1];

  // Pickup is judged first: a task cannot deliver what it never collected,
  // so that is the condition worth waiting on when both ends are wrong.
  if (warehouseCodes.has(pickup)) {
    const status = byCode.get(pickup);
    const blocked =
      status === undefined
        ? requireKnown
        : String(status) === NODE_STATUS_EMPTY;
    if (blocked) {
      return {
        ready: false,
        code: pickup,
        needStatus: NODE_STATUS_FULL,
        role: 'pickup',
      };
    }
  }

  // A route that starts and ends on the same node is a round trip: it is
  // collected from and returned to, so the slot it needs free at the end
  // is the very one it empties on the way out. Demanding both would make
  // such a route impossible to send, whatever the bin holds.
  if (drop !== pickup && warehouseCodes.has(drop)) {
    const status = byCode.get(drop);
    const blocked =
      // Finished goods make it occupied whatever RCS says.
      finishGoodCodes.has(drop) ||
      (status === undefined
        ? requireKnown
        : String(status) === NODE_STATUS_FULL);
    if (blocked) {
      return {
        ready: false,
        code: drop,
        needStatus: NODE_STATUS_EMPTY,
        role: 'drop',
      };
    }
  }

  return { ready: true };
}

interface BinDeps {
  warehouseLocationsRepository: IWarehouseLocationsRepository;
  factoryMapsRepository: IFactoryMapsRepository;
  rcsStockStatusService: RcsStockStatusService;
}

/** Active Warehouse Location codes and what they hold — no RCS involved. */
async function loadWarehouseCodes(deps: BinDeps): Promise<{
  warehouseCodes: Set<string>;
  finishGoodCodes: Set<string>;
}> {
  const { items } = await deps.warehouseLocationsRepository.findAll({
    page: 1,
    limit: 1000,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const active = items.filter(
    (location) => location.isActive && !location.deletedAt,
  );
  return {
    warehouseCodes: new Set(
      active.map((location) => location.iRaypleLocationCode),
    ),
    finishGoodCodes: new Set(
      active
        .filter((location) => location.binContent === 'FINISH_GOOD')
        .map((location) => location.iRaypleLocationCode),
    ),
  };
}

async function loadStockStatus(
  deps: BinDeps,
): Promise<Map<string, string | number>> {
  const { items: maps } = await deps.factoryMapsRepository.findAll({
    page: 1,
    limit: 100,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const areaIds = maps
    .map((map) => map.areaNumber)
    .filter((areaNumber): areaNumber is number => areaNumber != null);

  // No area means nothing to ask RCS about, so every code stays unknown —
  // which the rule reads as ready, the same fail-open as everywhere else.
  return areaIds.length
    ? deps.rcsStockStatusService.getStockStatusByCode(areaIds)
    : new Map<string, string | number>();
}

/** Both halves, for callers judging many routes against one fetch. */
export async function loadRouteBinContext(
  deps: BinDeps,
): Promise<RouteBinContext> {
  const { warehouseCodes, finishGoodCodes } = await loadWarehouseCodes(deps);
  return {
    warehouseCodes,
    finishGoodCodes,
    byCode: await loadStockStatus(deps),
  };
}

export async function checkRouteBins(
  deps: BinDeps,
  route: string[],
): Promise<RouteBinVerdict> {
  if (route.length === 0) return { ready: true };

  const { warehouseCodes, finishGoodCodes } = await loadWarehouseCodes(deps);
  const pickup = route[0];
  const drop = route[route.length - 1];

  // Neither end is a tracked bin, so RCS has nothing to say about this
  // route — skip the call rather than make it and ignore the answer.
  if (!warehouseCodes.has(pickup) && !warehouseCodes.has(drop)) {
    return { ready: true };
  }

  return evaluateRouteBins(route, {
    warehouseCodes,
    finishGoodCodes,
    byCode: await loadStockStatus(deps),
  });
}
