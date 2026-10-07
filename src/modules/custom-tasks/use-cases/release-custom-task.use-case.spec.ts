import { BadRequestException } from '@nestjs/common';
import { ReleaseCustomTaskUseCase } from './release-custom-task.use-case';

// The RCS instance available in development refuses or times out on every
// release, so the happy path cannot be exercised against the live server.
// These cover what the scan page depends on: that a successful release
// hands back the id of the history row it created, so the Current Queue
// card can cancel it without leaving the page.

const CODE = 'A1';
const ROUTE = ['T1B', 'T1B'];

function build(
  overrides: { activeRun?: unknown; createThrows?: boolean } = {},
) {
  const controlTask = {
    id: 'control-task-1',
    code: CODE,
    name: 'Supply line 3',
    route: ROUTE,
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

  // No warehouse leg on the route, so the bin guard short-circuits without
  // ever reaching RCS — this spec is about the release, not that guard.
  const warehouseLocationsRepository = {
    findAll: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  };
  const factoryMapsRepository = {
    findAll: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  };
  const rcsStockStatusService = {
    getStockStatusByCode: jest.fn().mockResolvedValue(new Map()),
  };

  const addTask = jest.fn().mockResolvedValue({ code: 1000 });
  const taskOrderService = { addTask };

  const publish = jest.fn();
  const realtime = { publish };

  const useCase = new ReleaseCustomTaskUseCase(
    controlTasksRepository as never,
    customTaskRunsRepository as never,
    warehouseLocationsRepository as never,
    factoryMapsRepository as never,
    rcsStockStatusService as never,
    taskOrderService as never,
    realtime as never,
  );

  return { useCase, create, addTask, publish, customTaskRunsRepository };
}

describe('ReleaseCustomTaskUseCase', () => {
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
