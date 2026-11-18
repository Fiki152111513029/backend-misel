import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { TaskOrderService } from '../../tasks/services/task-order.service';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type {
  ITrolleyActivitiesRepository,
  PendingTransitActivity,
} from '../repositories/trolley-activity-repository.interface';

// Five seconds. The wait being released late is the whole cost of a slow
// poll, and an operator standing next to a parked AMR notices a ten-second
// overshoot. Costs nothing when no task has a stop: the query comes back
// empty and RCS is never called.
const POLL_INTERVAL_MS = 5_000;

/**
 * Releases a Trolley Task that is parked at its transit stop, once the
 * stop's timer has run out.
 *
 * Nothing else does this. RCS holds the order at that node indefinitely
 * and publishes no event about it, so without this the AMR waits there
 * with a trolley on it until someone cancels the task.
 *
 * Two steps per task, because RCS has to be asked both questions:
 *
 *   1. Has the AMR actually reached the stop? There is no webhook for
 *      arriving at a node, so getTaskOrderStatus is polled and the stop is
 *      considered reached once the order reports a leg at that code. The
 *      arrival is stamped, and that stamp is when the wait starts counting
 *      — not the dispatch, which may be minutes earlier.
 *   2. Has it waited long enough? If so, continueTask.
 *
 * Fails safe in one direction only: anything it cannot confirm leaves the
 * task parked and tries again next tick. That is the right way round — a
 * continue sent too early moves an AMR that is still driving.
 */
@Injectable()
export class TrolleyTransitContinueService {
  private readonly logger = new Logger(TrolleyTransitContinueService.name);
  private running = false;

  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
    private readonly taskOrderService: TaskOrderService,
  ) {}

  @Interval(POLL_INTERVAL_MS)
  async poll(): Promise<void> {
    // Skipped rather than queued: an RCS call slower than the interval
    // must not let two ticks continue the same order twice.
    if (this.running) return;
    this.running = true;
    try {
      await this.releaseReady();
    } catch (error) {
      this.logger.warn(`Trolley transit watch failed: ${error}`);
    } finally {
      this.running = false;
    }
  }

  private async releaseReady(): Promise<void> {
    const waiting = await this.trolleyActivitiesRepository.findPendingTransit();
    if (waiting.length === 0) return;

    for (const activity of waiting) {
      try {
        await this.advance(activity);
      } catch (error) {
        // Per task, so one unreachable order does not stop the others.
        this.logger.warn(
          `Trolley task ${activity.taskId} could not be advanced past ${activity.transitLocationCode}: ${error}`,
        );
      }
    }
  }

  private async advance(activity: PendingTransitActivity): Promise<void> {
    const arrivedAt =
      activity.transitArrivedAt ?? (await this.detectArrival(activity));
    if (!arrivedAt) return;

    // Belongs to a task sent before the timer was required, or to one
    // whose snapshot is somehow missing. Continuing on a guessed wait
    // would move an AMR on a number nobody chose, so it stays parked and
    // says so once per tick.
    if (activity.continueTaskDelaySec == null) {
      this.logger.warn(
        `Trolley task ${activity.taskId} is waiting at ${activity.transitLocationCode} with no timer recorded — it will not be continued automatically`,
      );
      return;
    }

    const dueAt = arrivedAt.getTime() + activity.continueTaskDelaySec * 1000;
    if (Date.now() < dueAt) return;

    await this.taskOrderService.continueTask({ orderId: activity.taskId });
    // Only after RCS accepts it. continueTask throws on a refusal, so a
    // failure leaves continuedAt null and the next tick tries again --
    // rather than recording a continue that never happened and leaving the
    // AMR parked for good.
    await this.trolleyActivitiesRepository.markContinued(
      activity.id,
      new Date(),
    );
    this.logger.log(
      `Trolley task ${activity.taskId} continued after waiting ${activity.continueTaskDelaySec}s at ${activity.transitLocationCode}`,
    );
  }

  /**
   * Whether the order has reached its transit stop, stamping the moment it
   * is first seen there.
   *
   * Matched on the leg's own qrContent rather than a count of legs: RCS
   * decides its own route between the nodes we name, so the number of legs
   * an order reports is not something we can predict. The same matching is
   * what LookupLocationUseCase uses to tell whether an AMR has reached a
   * node.
   */
  private async detectArrival(
    activity: PendingTransitActivity,
  ): Promise<Date | null> {
    const progress = await this.taskOrderService.getTaskOrderStatus(
      activity.taskId,
    );
    const reached = progress.some(
      (row) => row.qrContent === activity.transitLocationCode,
    );
    if (!reached) return null;

    const at = new Date();
    await this.trolleyActivitiesRepository.markTransitArrived(activity.id, at);
    this.logger.log(
      `Trolley task ${activity.taskId} reached its transit stop ${activity.transitLocationCode} — waiting ${activity.continueTaskDelaySec ?? '?'}s`,
    );
    return at;
  }
}
