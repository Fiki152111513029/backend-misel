import { TrolleyTransitContinueService } from './trolley-transit-continue.service';

// None of this can be exercised against the development RCS: it does not
// know these node codes, and it will not park an order at one. These cover
// the part the floor is trusting — an AMR left waiting at a transit stop
// really does get released, exactly once, and only after it has actually
// waited the time it was given.
//
// Noticing the arrival is NOT this service's job: the webhook stamps
// transitArrivedAt when RCS reports subTaskSeq 25. Everything here starts
// from that stamp already being there, or deliberately missing.

const TRANSIT = 'PH1';
const ORDER = '20261118090000';

function activity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'activity-1',
    taskId: ORDER,
    transitLocationCode: TRANSIT,
    continueTaskDelaySec: 30,
    transitArrivedAt: null as Date | null,
    ...overrides,
  };
}

function build(options: {
  waiting?: ReturnType<typeof activity>[];
  continueThrows?: boolean;
}) {
  const findPendingTransit = jest
    .fn()
    .mockResolvedValue(options.waiting ?? []);
  const markContinued = jest.fn().mockResolvedValue(undefined);
  const trolleyActivitiesRepository = { findPendingTransit, markContinued };

  const continueTask = options.continueThrows
    ? jest.fn().mockRejectedValue(new Error('RCS refused'))
    : jest.fn().mockResolvedValue({ code: 1000 });
  // Present so a stray call would be caught rather than crash the test:
  // this service must never go asking where the robot is.
  const getTaskOrderStatus = jest.fn().mockResolvedValue([]);
  const taskOrderService = { continueTask, getTaskOrderStatus };

  // The Current Queue card counts down against transitArrivedAt, so the
  // continue has to be announced or the card keeps showing a finished wait.
  const publish = jest.fn();

  const service = new TrolleyTransitContinueService(
    trolleyActivitiesRepository as never,
    taskOrderService as never,
    { publish } as never,
  );

  return {
    service,
    findPendingTransit,
    markContinued,
    continueTask,
    getTaskOrderStatus,
    publish,
  };
}

/** A moment `secondsAgo` in the past, for an already-stamped arrival. */
function arrivedSecondsAgo(secondsAgo: number): Date {
  return new Date(Date.now() - secondsAgo * 1000);
}

describe('TrolleyTransitContinueService', () => {
  describe('the wait itself', () => {
    it('continues the order once the timer has run out', async () => {
      const { service, continueTask } = build({
        waiting: [activity({ transitArrivedAt: arrivedSecondsAgo(31) })],
      });
      await service.poll();
      expect(continueTask).toHaveBeenCalledWith({ orderId: ORDER });
    });

    it('leaves it parked while the timer is still running', async () => {
      const { service, continueTask } = build({
        waiting: [activity({ transitArrivedAt: arrivedSecondsAgo(10) })],
      });
      await service.poll();
      expect(continueTask).not.toHaveBeenCalled();
    });

    it('records the continue only after RCS accepts it', async () => {
      const { service, markContinued } = build({
        waiting: [activity({ transitArrivedAt: arrivedSecondsAgo(31) })],
      });
      await service.poll();
      expect(markContinued).toHaveBeenCalledWith(
        'activity-1',
        expect.any(Date),
      );
    });

    it('announces the continue so the card stops counting', async () => {
      const { service, publish } = build({
        waiting: [activity({ transitArrivedAt: arrivedSecondsAgo(31) })],
      });
      await service.poll();
      expect(publish).toHaveBeenCalledWith('trolley-activities');
    });
  });

  // The arrival stamp is the start of the wait and it comes from the
  // webhook. Without it the AMR is still driving, so there is nothing to
  // release — and nothing to ask RCS about either.
  describe('a task that has not reached its stop yet', () => {
    it('is skipped', async () => {
      const { service, continueTask } = build({ waiting: [activity()] });
      await service.poll();
      expect(continueTask).not.toHaveBeenCalled();
    });

    it('is skipped however long ago it was sent', async () => {
      // The timer counts from arrival, never from dispatch. An order that
      // left an hour ago and has not parked yet is still not waiting.
      const { service, continueTask } = build({
        waiting: [activity({ transitArrivedAt: null })],
      });
      await service.poll();
      expect(continueTask).not.toHaveBeenCalled();
    });

    it('costs no RCS call at all', async () => {
      const { service, getTaskOrderStatus } = build({
        waiting: [activity()],
      });
      await service.poll();
      expect(getTaskOrderStatus).not.toHaveBeenCalled();
    });
  });

  describe('when RCS will not take the continue', () => {
    // Recording a continue that never happened would park the AMR for
    // good: findPendingTransit skips anything already continued.
    it('leaves it un-continued so the next tick retries', async () => {
      const { service, markContinued } = build({
        waiting: [activity({ transitArrivedAt: arrivedSecondsAgo(31) })],
        continueThrows: true,
      });
      await service.poll();
      expect(markContinued).not.toHaveBeenCalled();
    });

    it('announces nothing, since nothing changed', async () => {
      const { service, publish } = build({
        waiting: [activity({ transitArrivedAt: arrivedSecondsAgo(31) })],
        continueThrows: true,
      });
      await service.poll();
      expect(publish).not.toHaveBeenCalled();
    });

    it('still serves the other tasks when one of them fails', async () => {
      const { service, continueTask } = build({
        waiting: [
          activity({
            id: 'a',
            taskId: 'order-a',
            transitArrivedAt: arrivedSecondsAgo(31),
          }),
          activity({
            id: 'b',
            taskId: 'order-b',
            transitArrivedAt: arrivedSecondsAgo(31),
          }),
        ],
        continueThrows: true,
      });
      await service.poll();
      // One throwing must not abandon the rest of the queue.
      expect(continueTask).toHaveBeenCalledTimes(2);
    });
  });

  describe('what it refuses to guess', () => {
    // A row from before the timer was required. Continuing on a made-up
    // wait would move an AMR on a number nobody chose.
    it('will not continue a task with no timer recorded', async () => {
      const { service, continueTask } = build({
        waiting: [
          activity({
            continueTaskDelaySec: null,
            transitArrivedAt: arrivedSecondsAgo(600),
          }),
        ],
      });
      await service.poll();
      expect(continueTask).not.toHaveBeenCalled();
    });
  });

  describe('what it avoids doing', () => {
    it('never calls RCS when nothing is waiting at a stop', async () => {
      const { service, continueTask, getTaskOrderStatus } = build({
        waiting: [],
      });
      await service.poll();
      expect(continueTask).not.toHaveBeenCalled();
      expect(getTaskOrderStatus).not.toHaveBeenCalled();
    });

    it('survives the database being unreachable', async () => {
      const { service, findPendingTransit } = build({});
      findPendingTransit.mockRejectedValueOnce(new Error('db down'));
      await expect(service.poll()).resolves.toBeUndefined();
    });
  });
});
