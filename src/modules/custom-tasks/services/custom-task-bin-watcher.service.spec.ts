import { CustomTaskBinWatcherService } from './custom-task-bin-watcher.service';

// The RCS instance available in development does not know these bin codes,
// so none of this can be exercised against the live server. These cover the
// part the operator is trusting: a task parked because its rack was empty
// really does go out once that rack is filled, exactly once.

const FULL = 2;
const EMPTY = 0;

function run(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'run-1',
    orderId: 'A120260101000000',
    modelProcessCode: 'liftshelf122',
    taskPath: 'WRL12,PT2A',
    fromSystem: 'MES',
    priority: 6,
    waitingForCode: 'WRL12',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function build(options: {
  waiting?: ReturnType<typeof run>[];
  stock?: Record<string, number>;
  addTaskThrows?: boolean;
  areaNumbers?: (number | null)[];
}) {
  const findWaitingForBin = jest
    .fn()
    .mockResolvedValue(options.waiting ?? []);
  const markDispatched = jest.fn().mockResolvedValue(undefined);
  const updateWait = jest.fn().mockResolvedValue(undefined);
  const customTaskRunsRepository = {
    findWaitingForBin,
    markDispatched,
    updateWait,
  };

  // Both ends of every fixture route are judged against this set, so the
  // warehouse codes have to be here for the rule to see them at all.
  const warehouseLocationsRepository = {
    findAll: jest.fn().mockResolvedValue({
      items: ['WRL12', 'WRL13'].map((code) => ({
        iRaypleLocationCode: code,
        isActive: true,
        deletedAt: null,
      })),
      total: 2,
    }),
  };

  const factoryMapsRepository = {
    findAll: jest.fn().mockResolvedValue({
      items: (options.areaNumbers ?? [1]).map((areaNumber) => ({ areaNumber })),
      total: 1,
    }),
  };

  const getStockStatusByCode = jest
    .fn()
    .mockResolvedValue(new Map(Object.entries(options.stock ?? {})));
  const rcsStockStatusService = { getStockStatusByCode };

  const addTask = options.addTaskThrows
    ? jest.fn().mockRejectedValue(new Error('RCS unreachable'))
    : jest.fn().mockResolvedValue({ code: 1000 });
  const taskOrderService = { addTask };

  const publish = jest.fn();

  const service = new CustomTaskBinWatcherService(
    customTaskRunsRepository as never,
    factoryMapsRepository as never,
    warehouseLocationsRepository as never,
    rcsStockStatusService as never,
    taskOrderService as never,
    { publish } as never,
  );

  return {
    service,
    addTask,
    markDispatched,
    updateWait,
    publish,
    getStockStatusByCode,
    findWaitingForBin,
  };
}

describe('CustomTaskBinWatcherService', () => {
  describe('once the rack is filled', () => {
    it('dispatches the held task', async () => {
      const { service, addTask } = build({
        waiting: [run()],
        stock: { WRL12: FULL },
      });
      await service.poll();
      expect(addTask).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'A120260101000000',
          taskOrderDetail: [{ taskPath: 'WRL12,PT2A' }],
        }),
      );
    });

    it('sends it with the values captured when the operator sent it', async () => {
      const { service, addTask } = build({
        waiting: [run({ fromSystem: 'WMS', priority: 3 })],
        stock: { WRL12: FULL },
      });
      await service.poll();
      expect(addTask).toHaveBeenCalledWith(
        expect.objectContaining({ fromSystem: 'WMS', priority: 3 }),
      );
    });

    it('clears the wait so it is never dispatched twice', async () => {
      const { service, markDispatched } = build({
        waiting: [run()],
        stock: { WRL12: FULL },
      });
      await service.poll();
      expect(markDispatched).toHaveBeenCalledWith('run-1');
    });

    it('announces the change so open pages stop showing it as waiting', async () => {
      const { service, publish } = build({
        waiting: [run()],
        stock: { WRL12: FULL },
      });
      await service.poll();
      expect(publish).toHaveBeenCalledWith('custom-tasks');
    });
  });

  describe('while the rack is still empty', () => {
    it('leaves the task waiting', async () => {
      const { service, addTask, markDispatched } = build({
        waiting: [run()],
        stock: { WRL12: EMPTY },
      });
      await service.poll();
      expect(addTask).not.toHaveBeenCalled();
      expect(markDispatched).not.toHaveBeenCalled();
    });

    it('says nothing, so pages are not woken for a non-event', async () => {
      const { service, publish } = build({
        waiting: [run()],
        stock: { WRL12: EMPTY },
      });
      await service.poll();
      expect(publish).not.toHaveBeenCalled();
    });
  });

  describe('two tasks waiting on the same rack', () => {
    const older = run({ id: 'older', orderId: 'A1-older' });
    const newer = run({
      id: 'newer',
      orderId: 'A1-newer',
      createdAt: new Date('2026-01-02T00:00:00Z'),
    });

    it('sends only one — there is only one pallet', async () => {
      const { service, addTask } = build({
        waiting: [older, newer],
        stock: { WRL12: FULL },
      });
      await service.poll();
      expect(addTask).toHaveBeenCalledTimes(1);
    });

    it('sends the one that was asked for first', async () => {
      const { service, addTask } = build({
        waiting: [older, newer],
        stock: { WRL12: FULL },
      });
      await service.poll();
      expect(addTask).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: 'A1-older' }),
      );
    });

    it('still serves two tasks waiting on different racks', async () => {
      const { service, addTask } = build({
        waiting: [
          older,
          run({ id: 'other', waitingForCode: 'WRL13', taskPath: 'WRL13,PT2A' }),
        ],
        stock: { WRL12: FULL, WRL13: FULL },
      });
      await service.poll();
      expect(addTask).toHaveBeenCalledTimes(2);
    });
  });

  describe('when RCS will not take it', () => {
    it('keeps the task waiting rather than losing it', async () => {
      const { service, markDispatched } = build({
        waiting: [run()],
        stock: { WRL12: FULL },
        addTaskThrows: true,
      });
      await service.poll();
      expect(markDispatched).not.toHaveBeenCalled();
    });

    it('lets the next task on that rack try in the same tick', async () => {
      // The rack is genuinely full; the first send failing is about RCS,
      // not about the rack being taken.
      const { service, addTask } = build({
        waiting: [run({ id: 'a' }), run({ id: 'b', orderId: 'A1-b' })],
        stock: { WRL12: FULL },
        addTaskThrows: true,
      });
      await service.poll();
      expect(addTask).toHaveBeenCalledTimes(2);
    });
  });

  describe('what it avoids doing', () => {
    it('never asks RCS when nothing is waiting', async () => {
      const { service, getStockStatusByCode } = build({ waiting: [] });
      await service.poll();
      expect(getStockStatusByCode).not.toHaveBeenCalled();
    });

    it('does nothing when no map has an area number', async () => {
      const { service, addTask, getStockStatusByCode } = build({
        waiting: [run()],
        stock: { WRL12: FULL },
        areaNumbers: [null],
      });
      await service.poll();
      expect(getStockStatusByCode).not.toHaveBeenCalled();
      expect(addTask).not.toHaveBeenCalled();
    });

    it('leaves the task alone when RCS reports nothing about the rack', async () => {
      const { service, addTask } = build({ waiting: [run()], stock: {} });
      await service.poll();
      expect(addTask).not.toHaveBeenCalled();
    });

    it('survives a failing poll without throwing', async () => {
      const { service, findWaitingForBin } = build({ waiting: [run()] });
      findWaitingForBin.mockRejectedValueOnce(new Error('db down'));
      await expect(service.poll()).resolves.toBeUndefined();
    });
  });
});
