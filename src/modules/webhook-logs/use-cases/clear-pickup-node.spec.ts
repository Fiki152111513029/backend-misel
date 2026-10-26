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
    findCustomTaskRunNoticeContext: jest.fn().mockResolvedValue(null),
  };

  const warehouseLocationsRepository = {
    findAll: jest.fn().mockResolvedValue({
      items: [{ iRaypleLocationCode: WRL12, isActive: true, deletedAt: null }],
      total: 1,
    }),
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

  return { useCase, updateStockStatus, publish, webhookLogsRepository };
}

function payload(status: string) {
  return { orderId: ORDER_ID, deviceCode: 'AMR0001', status };
}

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
