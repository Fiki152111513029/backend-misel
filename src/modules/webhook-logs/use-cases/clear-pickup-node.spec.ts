import { ReceiveTaskStatusWebhookUseCase } from './receive-task-status-webhook.use-case';

// Clearing a Custom Task's pickup node once the AGV lifts its rack cannot
// be exercised against the RCS instance available in development, so these
// cover it directly. The rule: on RCS status 21 (Picked), and only for a
// Custom Task whose first leg is a tracked Warehouse Location, tell RCS
// that node is now empty.

const WRL12 = 'WRL12';
const PT2A = 'PT2A'; // a Production Location — occupancy is not tracked
const ORDER_ID = 'A120261026120000';

const PICKED = '21';
const PICKING = '20';
const RUNNING = '6';

function build(options: {
  /** taskPath of the Custom Task behind the order; null = not a Custom Task. */
  taskPath?: string | null;
  /** Whether the run matched a CustomTaskRun row at all. */
  matchedCustomTask?: boolean;
} = {}) {
  const webhookLogsRepository = {
    createLog: jest.fn().mockResolvedValue(undefined),
    findRobotIdByDeviceCode: jest.fn().mockResolvedValue(null),
    updateTaskStatusByTaskId: jest.fn().mockResolvedValue(false),
    updateWarehouseCartTaskStatusByTaskId: jest.fn().mockResolvedValue(false),
    updateCustomTaskRunStatusByTaskId: jest
      .fn()
      .mockResolvedValue(options.matchedCustomTask ?? true),
    updateTrolleyActivityStatusByTaskId: jest.fn().mockResolvedValue(false),
    findCustomTaskRunTaskPathByOrderId: jest
      .fn()
      .mockResolvedValue(
        options.taskPath === undefined ? `${WRL12},${PT2A}` : options.taskPath,
      ),
    // The running notice reads from here; these tests are about clearing
    // the node, so it is stubbed to report no robot and stay quiet.
    findCustomTaskRunNoticeContext: jest.fn().mockResolvedValue(
      options.taskPath === null
        ? null
        : {
            taskPath:
              options.taskPath === undefined
                ? `${WRL12},${PT2A}`
                : options.taskPath,
            requester: 'WRL23L',
            // No robot yet, so the "on its way" notice stays quiet and
            // these tests only see the ones they are about.
            robotName: null,
          },
    ),
  };

  const updateLocation = jest.fn().mockResolvedValue(undefined);
  const warehouseLocationsRepository = {
    findAll: jest.fn().mockResolvedValue({
      items: [
        { id: 'loc-1', iRaypleLocationCode: WRL12, isActive: true, deletedAt: null },
      ],
      total: 1,
    }),
    findActiveByLocationCode: jest
      .fn()
      .mockImplementation((code: string) =>
        Promise.resolve(
          code === WRL12
            ? { id: 'loc-1', iRaypleLocationCode: WRL12 }
            : null,
        ),
      ),
    update: updateLocation,
  };

  const updateStockStatus = jest.fn().mockResolvedValue(undefined);
  const rcsStockStatusService = { updateStockStatus };

  const publish = jest.fn();
  const publishWarehouseNotice = jest.fn();

  const useCase = new ReceiveTaskStatusWebhookUseCase(
    webhookLogsRepository as never,
    { getTaskOrderStatus: jest.fn() } as never,
    { publish, publishWarehouseNotice } as never,
    rcsStockStatusService as never,
    warehouseLocationsRepository as never,
  );

  return {
    useCase,
    updateStockStatus,
    updateLocation,
    publish,
    publishWarehouseNotice,
    webhookLogsRepository,
  };
}

function payload(status: string) {
  return { orderId: ORDER_ID, deviceCode: 'AMR0001', status };
}

const PLACED = '23';
const PLACING = '22';

describe('ReceiveTaskStatusWebhookUseCase — the drop node', () => {
  // RCS has no value that means "finished goods": 0 is empty and 2 is
  // "empty rack ready to collect", which would hand the goods to the next
  // AMR sent for an empty rack. So RCS is left out of it entirely.
  it('does not touch RCS at all', async () => {
    const { useCase, updateStockStatus } = build({
      taskPath: `${PT2A},${WRL12}`,
    });
    await useCase.execute(payload(PLACED));
    expect(updateStockStatus).not.toHaveBeenCalled();
  });

  it('records the finished goods on our own row instead', async () => {
    const { useCase, updateLocation } = build({
      taskPath: `${PT2A},${WRL12}`,
    });
    await useCase.execute(payload(PLACED));
    expect(updateLocation).toHaveBeenCalledWith('loc-1', {
      binContent: 'FINISH_GOOD',
    });
  });

  it('announces the arrival to the warehouse', async () => {
    const { useCase, publishWarehouseNotice } = build({
      taskPath: `${PT2A},${WRL12}`,
    });
    await useCase.execute(payload(PLACED));
    expect(publishWarehouseNotice).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'drop-done', nodeCode: WRL12 }),
    );
  });

  it('leaves a production drop alone — its occupancy is not tracked', async () => {
    // Asserted on updateLocation rather than the RCS call, which this path
    // no longer makes for any drop and so could never catch a regression.
    const { useCase, updateLocation, publishWarehouseNotice } = build({
      taskPath: `${WRL12},${PT2A}`,
    });
    await useCase.execute(payload(PLACED));
    expect(updateLocation).not.toHaveBeenCalled();
    expect(publishWarehouseNotice).not.toHaveBeenCalled();
  });

  it('does nothing while the rack is still being placed', async () => {
    const { useCase, updateLocation } = build({
      taskPath: `${PT2A},${WRL12}`,
    });
    await useCase.execute(payload(PLACING));
    expect(updateLocation).not.toHaveBeenCalled();
  });
});

describe('ReceiveTaskStatusWebhookUseCase — clearing the pickup node', () => {
  it('marks the pickup node empty once the rack is picked', async () => {
    const { useCase, updateStockStatus } = build();
    await useCase.execute(payload(PICKED));
    expect(updateStockStatus).toHaveBeenCalledWith(WRL12, '0');
  });

  it('tells open pages the stock changed', async () => {
    const { useCase, publish } = build();
    await useCase.execute(payload(PICKED));
    expect(publish).toHaveBeenCalledWith('stock');
  });

  it('clears whatever was recorded as standing there', async () => {
    const { useCase, updateLocation } = build();
    await useCase.execute(payload(PICKED));
    expect(updateLocation).toHaveBeenCalledWith('loc-1', { binContent: null });
  });

  it('does nothing while the rack is still being lifted', async () => {
    // 20 is Picking — the rack has not left the node yet.
    const { useCase, updateStockStatus } = build();
    await useCase.execute(payload(PICKING));
    expect(updateStockStatus).not.toHaveBeenCalled();
  });

  it('does nothing for an ordinary in-progress update', async () => {
    const { useCase, updateStockStatus } = build();
    await useCase.execute(payload(RUNNING));
    expect(updateStockStatus).not.toHaveBeenCalled();
  });

  it('leaves a production pickup alone — its occupancy is not tracked', async () => {
    const { useCase, updateStockStatus } = build({
      taskPath: `${PT2A},${WRL12}`,
    });
    await useCase.execute(payload(PICKED));
    expect(updateStockStatus).not.toHaveBeenCalled();
  });

  it('does nothing when the order is not a Custom Task', async () => {
    const { useCase, updateStockStatus } = build({ matchedCustomTask: false });
    await useCase.execute(payload(PICKED));
    expect(updateStockStatus).not.toHaveBeenCalled();
  });

  it('does nothing when no route is on record for the order', async () => {
    const { useCase, updateStockStatus } = build({ taskPath: null });
    await useCase.execute(payload(PICKED));
    expect(updateStockStatus).not.toHaveBeenCalled();
  });

  it('still acks 1000 when the RCS stock call is unavailable', async () => {
    // RCS retries anything but a 1000 ack, so a failure here must not turn
    // into a retry storm over a bookkeeping call.
    const { useCase, updateStockStatus } = build();
    updateStockStatus.mockRejectedValueOnce(new Error('RCS unreachable'));
    await expect(useCase.execute(payload(PICKED))).resolves.toEqual(
      expect.objectContaining({ code: 1000 }),
    );
  });
});
