import { TrolleyTransitContinueService } from './trolley-transit-continue.service';

// None of this can be exercised against the development RCS: it does not
// know these node codes, and it will not park an order at one. These cover
// the part the floor is trusting — an AMR left waiting at a transit stop
// really does get released, exactly once, and only after it has actually
// arrived and actually waited.

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
  /** qrContent values getTaskOrderStatus reports for the order. */
  reachedCodes?: string[];
  continueThrows?: boolean;
  statusThrows?: boolean;
}) {
  const findPendingTransit = jest
    .fn()
    .mockResolvedValue(options.waiting ?? []);
  const markTransitArrived = jest.fn().mockResolvedValue(undefined);
  const markContinued = jest.fn().mockResolvedValue(undefined);
  const trolleyActivitiesRepository = {
    findPendingTransit,
    markTransitArrived,
    markContinued,
  };

  const getTaskOrderStatus = options.statusThrows
    ? jest.fn().mockRejectedValue(new Error('RCS unreachable'))
    : jest.fn().mockResolvedValue(
        (options.reachedCodes ?? []).map((qrContent, index) => ({
          subTaskSeq: index + 1,
          qrContent,
        })),
      );
  const continueTask = options.continueThrows
    ? jest.fn().mockRejectedValue(new Error('RCS refused'))
    : jest.fn().mockResolvedValue({ code: 1000 });
  const taskOrderService = { getTaskOrderStatus, continueTask };

  const service = new TrolleyTransitContinueService(
    trolleyActivitiesRepository as never,
    taskOrderService as never,
  );

  return {
    service,
    findPendingTransit,
    markTransitArrived,
    markContinued,
    getTaskOrderStatus,
    continueTask,
  };
}

/** A moment `secondsAgo` in the past, for an already-stamped arrival. */
function arrivedSecondsAgo(secondsAgo: number): Date {
  return new Date(Date.now() - secondsAgo * 1000);
}

describe('TrolleyTransitContinueService', () => {
  describe('detecting that the AMR has reached the stop', () => {
    it('stamps the arrival once the order reports a leg at that node', async () => {
      const { service, markTransitArrived } = build({
        waiting: [activity()],
        reachedCodes: ['WRL21', TRANSIT],
      });
      await service.poll();
      expect(markTransitArrived).toHaveBeenCalledWith(
        'activity-1',
        expect.any(Date),
      );
    });

    it('does not stamp it while the order has only reached the pickup', async () => {
      const { service, markTransitArrived, continueTask } = build({
        waiting: [activity()],
        reachedCodes: ['WRL21'],
      });
      await service.poll();
      expect(markTransitArrived).not.toHaveBeenCalled();
      expect(continueTask).not.toHaveBeenCalled();
    });

    it('stops asking RCS where it is once the arrival is stamped', async () => {
      const { service, getTaskOrderStatus } = build({
        waiting: [activity({ transitArrivedAt: arrivedSecondsAgo(5) })],
      });
      await service.poll();
      expect(getTaskOrderStatus).not.toHaveBeenCalled();
    });
  });

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

    // The arrival is what the wait counts from, so a task that has only
    // just got there waits its full timer however long the drive took.
    it('counts from the arrival, not from dispatch', async () => {
      const { service, continueTask } = build({
        waiting: [activity()],
        reachedCodes: [TRANSIT],
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
  });

  describe('when RCS will not play along', () => {
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

    it('keeps the task parked when it cannot tell where the AMR is', async () => {
      const { service, markTransitArrived, continueTask } = build({
        waiting: [activity()],
        statusThrows: true,
      });
      await service.poll();
      expect(markTransitArrived).not.toHaveBeenCalled();
      expect(continueTask).not.toHaveBeenCalled();
    });

    it('still serves the other tasks when one of them fails', async () => {
      const { service, continueTask, getTaskOrderStatus } = build({
        waiting: [
          activity({ id: 'a', taskId: 'order-a' }),
          activity({
            id: 'b',
            taskId: 'order-b',
            transitArrivedAt: arrivedSecondsAgo(31),
          }),
        ],
        statusThrows: true,
      });
      await service.poll();
      // The first needs RCS to say where it is and that call throws; the
      // second is already stamped, so it goes out regardless.
      expect(getTaskOrderStatus).toHaveBeenCalledTimes(1);
      expect(continueTask).toHaveBeenCalledWith({ orderId: 'order-b' });
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
      const { service, getTaskOrderStatus, continueTask } = build({
        waiting: [],
      });
      await service.poll();
      expect(getTaskOrderStatus).not.toHaveBeenCalled();
      expect(continueTask).not.toHaveBeenCalled();
    });

    it('survives the database being unreachable', async () => {
      const { service, findPendingTransit } = build({});
      findPendingTransit.mockRejectedValueOnce(new Error('db down'));
      await expect(service.poll()).resolves.toBeUndefined();
    });
  });
});
