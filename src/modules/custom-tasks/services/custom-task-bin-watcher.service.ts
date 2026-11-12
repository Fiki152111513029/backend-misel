import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { FACTORY_MAPS_REPOSITORY } from '../../factory-maps/repositories/factory-map-repository.interface';
import type { IFactoryMapsRepository } from '../../factory-maps/repositories/factory-map-repository.interface';
import { RcsStockStatusService } from '../../rcs-stock-status/rcs-stock-status.service';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import {
  evaluateRouteBins,
  loadRouteBinContext,
} from '../use-cases/check-route-bins';
import { TaskOrderService } from '../../tasks/services/task-order.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { DEFAULT_PRIORITY } from '../use-cases/resolve-custom-task';
import { CUSTOM_TASK_RUNS_REPOSITORY } from '../repositories/custom-task-run-repository.interface';
import type { ICustomTaskRunsRepository } from '../repositories/custom-task-run-repository.interface';

// Fast enough that a filled rack starts moving while the operator is still
// nearby, slow enough that an idle floor is not calling RCS constantly. The
// poll costs nothing at all when no task is waiting — the query returns
// empty and we never reach RCS.
const POLL_INTERVAL_MS = 10_000;

/**
 * Dispatches Custom Tasks that were held back because their pickup rack was
 * empty, as soon as RCS reports that rack filled.
 *
 * RCS publishes no event when a bin changes, so this has to ask. It is the
 * only thing that does: a held run is invisible to the rest of the system
 * until it is sent, and nothing else will ever pick it up.
 */
@Injectable()
export class CustomTaskBinWatcherService {
  private readonly logger = new Logger(CustomTaskBinWatcherService.name);
  private running = false;

  constructor(
    @Inject(CUSTOM_TASK_RUNS_REPOSITORY)
    private readonly customTaskRunsRepository: ICustomTaskRunsRepository,
    @Inject(FACTORY_MAPS_REPOSITORY)
    private readonly factoryMapsRepository: IFactoryMapsRepository,
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
    private readonly rcsStockStatusService: RcsStockStatusService,
    private readonly taskOrderService: TaskOrderService,
    private readonly realtime: RealtimeService,
  ) {}

  @Interval(POLL_INTERVAL_MS)
  async poll(): Promise<void> {
    // Skip rather than queue an overlapping run: a slow RCS call must not
    // let two ticks dispatch the same held task twice.
    if (this.running) return;
    this.running = true;
    try {
      await this.dispatchReady();
    } catch (error) {
      this.logger.warn(`Custom task bin watch failed: ${error}`);
    } finally {
      this.running = false;
    }
  }

  private async dispatchReady(): Promise<void> {
    const waiting = await this.customTaskRunsRepository.findWaitingForBin();
    if (waiting.length === 0) return;

    // Fetched once for the whole batch rather than per task.
    const context = await loadRouteBinContext({
      warehouseLocationsRepository: this.warehouseLocationsRepository,
      factoryMapsRepository: this.factoryMapsRepository,
      rcsStockStatusService: this.rcsStockStatusService,
    });

    // One pallet per rack, so one task per rack per tick. findWaitingForBin
    // returns oldest first, so claiming each code once here means the task
    // asked for first is the one that gets it; the rest keep waiting.
    const claimed = new Set<string>();
    let dispatched = false;

    for (const run of waiting) {
      // The whole route is re-evaluated, not just the end it parked on. A
      // task held for an empty pickup could otherwise be released into a
      // drop slot that filled up while it waited.
      const route = run.taskPath.split(',').map((leg) => leg.trim());
      // requireKnown: a parked task is only released on a positive
      // reading. RCS going quiet is not proof the bin was put right.
      const verdict = evaluateRouteBins(route, context, {
        requireKnown: true,
      });

      if (!verdict.ready) {
        // Still blocked — and possibly by the other end now, so keep the
        // stored condition in step with what it is actually waiting for.
        if (
          verdict.code !== run.waitingForCode ||
          verdict.needStatus !== run.waitingForStatus
        ) {
          await this.customTaskRunsRepository.updateWait(
            run.id,
            verdict.code,
            verdict.needStatus,
          );
        }
        continue;
      }

      const code = run.waitingForCode ?? route[0];
      if (claimed.has(code)) continue;
      claimed.add(code);

      try {
        await this.taskOrderService.addTask({
          modelProcessCode: run.modelProcessCode,
          // Snapshotted when the operator sent it, so an edit to the
          // Control Task while it waited cannot change what goes out.
          priority: run.priority ?? DEFAULT_PRIORITY,
          fromSystem: run.fromSystem ?? '',
          orderId: run.orderId,
          taskOrderDetail: [{ taskPath: run.taskPath }],
        });
      } catch (error) {
        // Leave the run waiting and let the rack be claimed again next
        // tick. A refusal here is usually RCS being unreachable or busy,
        // which the next poll may well get past — dropping the task
        // instead would lose work the operator believes is queued.
        claimed.delete(code);
        this.logger.warn(
          `Held custom task ${run.orderId} could not be dispatched once ${code} was ready: ${error}`,
        );
        continue;
      }

      await this.customTaskRunsRepository.markDispatched(run.id);
      dispatched = true;
      this.logger.log(
        `Held custom task ${run.orderId} dispatched — its route bins are ready`,
      );
    }

    // One signal for the batch: the scan page and Task Custom both need to
    // stop showing these as waiting.
    if (dispatched) this.realtime.publish('custom-tasks');
  }
}
