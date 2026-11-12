import { BadRequestException } from '@nestjs/common';
import { ReleaseCustomTaskUseCase } from './release-custom-task.use-case';

// The RCS instance available in development refuses or times out on every
// release, so the happy path cannot be exercised against the live server.
// These cover what the scan page depends on: that a successful release
// hands back the id of the history row it created, so the Current Queue
// card can cancel it without leaving the page.

const CODE = 'A1';
const ROUTE = ['T1B', 'T1B'];

const WAREHOUSE_ROUTE = ['WRL12', 'PT2A'];

function build(
  overrides: {
    activeRun?: unknown;
    createThrows?: boolean;
    /** Route starts on a warehouse bin RCS reports as empty. */
    emptyPickup?: boolean;
  } = {},
) {
  const controlTask = {
    id: 'control-task-1',
    code: CODE,
    name: 'Supply line 3',
    route: overrides.emptyPickup ? WAREHOUSE_ROUTE : ROUTE,
    isActive: true,
    modelCodeProcess: {
      id: 'm1',
      name: 'liftshelf122',
      fromSystem: 'MES',
      isActive: true,
    },
  };

  const controlTasksRepository = {
    findByCode: jest.fn().mockResolvedValue(controlTask),
  };

  const create = jest
    .fn()
    .mockImplementation(() =>
      overrides.createThrows
        ? Promise.reject(new Error('db down'))
        : Promise.resolve({ id: 'run-123' }),
    );

  const customTaskRunsRepository = {
    create,
    findActiveByControlTaskId: jest
      .fn()
      .mockResolvedValue(overrides.activeRun ?? null),
  };

  // By default no warehouse leg on the route, so the bin check
  // short-circuits without ever reaching RCS — most of this spec is about
  // the release, not that check. emptyPickup flips it to a warehouse
  // pickup RCS reports as empty, which is what parks the task.
  const warehouseLocationsRepository = {
    findAll: jest.fn().mockResolvedValue({
      items: overrides.emptyPickup
        ? [
            {
              iRaypleLocationCode: 'WRL12',
              isActive: true,
              deletedAt: null,
            },
          ]
        : [],
      total: overrides.emptyPickup ? 1 : 0,
    }),
  };
  const factoryMapsRepository = {
    findAll: jest.fn().mockResolvedValue({
      items: overrides.emptyPickup ? [{ areaNumber: 1 }] : [],
      total: overrides.emptyPickup ? 1 : 0,
    }),
  };
  const rcsStockStatusService = {
    getStockStatusByCode: jest
      .fn()
      .mockResolvedValue(
        overrides.emptyPickup ? new Map([['WRL12', 0]]) : new Map(),
      ),
  };

  const addTask = jest.fn().mockResolvedValue({ code: 1000 });
  const taskOrderService = { addTask };

  const publish = jest.fn();
  const publishWarehouseNotice = jest.fn();
  const realtime = { publish, publishWarehouseNotice };

  const useCase = new ReleaseCustomTaskUseCase(
    controlTasksRepository as never,
    customTaskRunsRepository as never,
    warehouseLocationsRepository as never,
    factoryMapsRepository as never,
    rcsStockStatusService as never,
    taskOrderService as never,
    realtime as never,
  );

  return {
    useCase,
    create,
    addTask,
    publish,
    publishWarehouseNotice,
    customTaskRunsRepository,
  };
}

describe('ReleaseCustomTaskUseCase', () => {
  describe('when the pickup rack is empty', () => {
    it('holds the task instead of refusing it', async () => {
      const { useCase } = build({ emptyPickup: true });
      const result = await useCase.execute(CODE, 'operator-1');
      expect(result.queued).toBe(true);
      expect(result.waitingForCode).toBe('WRL12');
    });

    it('sends nothing to RCS', async () => {
      const { useCase, addTask } = build({ emptyPickup: true });
      await useCase.execute(CODE, 'operator-1');
      expect(addTask).not.toHaveBeenCalled();
    });

    it('records the row with the rack it is waiting on', async () => {
      const { useCase, create } = build({ emptyPickup: true });
      const result = await useCase.execute(CODE, 'operator-1');
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: result.orderId,
          waitingForCode: 'WRL12',
          fromSystem: 'MES',
        }),
      );
    });

    it('hands back a runId so the operator can cancel the wait', async () => {
      const { useCase } = build({ emptyPickup: true });
      const result = await useCase.execute(CODE, 'operator-1');
      expect(result.runId).toBe('run-123');
    });

    it('reports no release time, because nothing was released', async () => {
      const { useCase } = build({ emptyPickup: true });
      const result = await useCase.execute(CODE, 'operator-1');
      expect(result.releasedAt).toBeNull();
    });

    it('fails loudly when the row cannot be saved', async () => {
      // Unlike a dispatched task, a held one exists nowhere else. Losing
      // the row would mean it never runs, so the operator must be told
      // rather than led to believe it is queued.
      const { useCase } = build({ emptyPickup: true, createThrows: true });
      await expect(useCase.execute(CODE, 'operator-1')).rejects.toThrow(
        'db down',
      );
    });

    it('tells the operator a held task is already waiting on that rack', async () => {
      const { useCase } = build({
        activeRun: {
          orderId: 'A120260101000000',
          waitingForBinAt: new Date(),
          waitingForCode: 'WRL12',
        },
      });
      await expect(useCase.execute(CODE, 'operator-1')).rejects.toThrow(
        /already waiting for rack WRL12/,
      );
    });
  });

  it('reports a normal send as not queued', async () => {
    const { useCase } = build();
    const result = await useCase.execute(CODE, 'operator-1');
    expect(result.queued).toBe(false);
    expect(result.releasedAt).toBeInstanceOf(Date);
  });

  it('returns the id of the history row it created', async () => {
    const { useCase } = build();
    const result = await useCase.execute(CODE, 'operator-1');
    expect(result.runId).toBe('run-123');
  });

  it('builds the order id from the code plus a 14-digit timestamp', async () => {
    const { useCase } = build();
    const result = await useCase.execute(CODE, 'operator-1');
    expect(result.orderId).toMatch(new RegExp(`^${CODE}\\d{14}$`));
  });

  it('records the run under the same order id it sent to RCS', async () => {
    const { useCase, create, addTask } = build();
    const result = await useCase.execute(CODE, 'operator-1');
    expect(addTask).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: result.orderId }),
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: result.orderId,
        operatorId: 'operator-1',
      }),
    );
  });

  it('still succeeds, with a null runId, when the row cannot be saved', async () => {
    // The task is already running in RCS at that point, so failing here
    // would tell the operator it did not work and invite a duplicate.
    const { useCase } = build({ createThrows: true });
    const result = await useCase.execute(CODE, 'operator-1');
    expect(result.runId).toBeNull();
    expect(result.orderId).toBeDefined();
  });

  it('refuses a second release while one is still outstanding', async () => {
    const { useCase, addTask } = build({
      activeRun: { orderId: 'A120260101000000' },
    });
    await expect(useCase.execute(CODE, 'operator-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(addTask).not.toHaveBeenCalled();
  });

  it('names the outstanding order in that refusal', async () => {
    const { useCase } = build({ activeRun: { orderId: 'A120260101000000' } });
    await expect(useCase.execute(CODE, 'operator-1')).rejects.toThrow(
      /already running.*A120260101000000/s,
    );
  });

  it('announces the release so other open pages can refresh', async () => {
    const { useCase, publish } = build();
    await useCase.execute(CODE, 'operator-1');
    expect(publish).toHaveBeenCalledWith('custom-tasks');
  });

  it('announces nothing when the release was refused', async () => {
    const { useCase, publish } = build({
      activeRun: { orderId: 'A120260101000000' },
    });
    await expect(useCase.execute(CODE, 'operator-1')).rejects.toThrow();
    expect(publish).not.toHaveBeenCalled();
  });
});
