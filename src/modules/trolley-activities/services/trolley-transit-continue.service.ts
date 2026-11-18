import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { TaskOrderService } from '../../tasks/services/task-order.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type {
  ITrolleyActivitiesRepository,
  PendingTransitActivity,
} from '../repositories/trolley-activity-repository.interface';

// Five seconds. The wait being released late is the whole cost of a slow
// tick, and an operator standing next to a parked AMR notices a ten-second
// overshoot. Costs nothing when no task is waiting: the query comes back
// empty and RCS is never called.
const POLL_INTERVAL_MS = 5_000;

/**
 * Releases a Trolley Task that is parked at its transit stop, once the
 * stop's timer has run out.
 *
 * Nothing else does this. RCS holds the order at that node indefinitely
 * once it has parked there, so without this the AMR waits with a trolley
 * on it until someone cancels the task.
 *
 * It only owns the second half of the wait. The first half — noticing that
 * the AMR has arrived — belongs to ReceiveTaskStatusWebhookUseCase, which
 * stamps transitArrivedAt when RCS reports subTaskSeq 25 for the order.
 * This service exists purely because the deadline that follows is a
 * passage of time, and nothing pushes an event when time passes.
 *
 * So a task with no arrival stamp is simply not ready: it is skipped, with
 * no call to RCS at all. The watcher never second-guesses where the robot
 * is.
 *
 * Fails safe in one direction only: anything it cannot complete leaves the
 * task parked and tries again next tick. That is the right way round — a
 * continue that goes missing costs a retry, while one sent twice moves an
 * AMR nobody asked to move.
 */
@Injectable()
export class TrolleyTransitContinueService {
  private readonly logger = new Logger(TrolleyTransitContinueService.name);
  private running = false;

  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
    private readonly taskOrderService: TaskOrderService,
    private readonly realtime: RealtimeService,
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
    // Not stamped yet means RCS has not reported subTaskSeq 25 for this
    // order, so the AMR is still on its way and there is no wait running.
    const arrivedAt = activity.transitArrivedAt;
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
    // The operator's Current Queue card is counting down against the
    // arrival stamp; without this it would keep showing a finished wait
    // until some other event happened to refresh it.
    this.realtime.publish('trolley-activities');
    this.logger.log(
      `Trolley task ${activity.taskId} continued after waiting ${activity.continueTaskDelaySec}s at ${activity.transitLocationCode}`,
    );
  }

}
