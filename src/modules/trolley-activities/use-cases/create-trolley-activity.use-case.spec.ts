import { CreateTrolleyActivityUseCase } from './create-trolley-activity.use-case';

// Covers only what the route looks like when it leaves here — the one
// thing RCS cannot be asked about afterwards, and the thing a transit stop
// changes. The development RCS rejects these node codes outright, so the
// payload it would have received is checked here instead.

const SCAN = 'WRL21';
const TRANSIT = 'PH1';
const DROP = 'PH9';

function build(options: {
  /** Set on the Trolley; null for a trolley with no stop. */
  transitLocationCode?: string | null;
  /** Set on the Trolley's own Model Code Process. */
  continueTaskDelaySec?: number | null;
  /** false makes the scanned code a Production Location instead. */
  pickupIsWarehouse?: boolean;
}) {
  const {
    transitLocationCode = null,
    continueTaskDelaySec = 30,
    pickupIsWarehouse = true,
  } = options;

  const trolleysRepository = {
    findById: jest.fn().mockResolvedValue({
      id: 'trolley-1',
      name: 'Trolley 1',
      status: 'EMPTY',
      droppingLocationCode: DROP,
      transitLocationCode,
      modelCodeProcess: {
        id: 'mcp-1',
        name: 'liftshelf122',
        fromSystem: 'MES',
        continueTaskDelaySec,
      },
      category: {
        id: 'cat-1',
        name: 'Category 1',
        modelCodeProcess: {
          id: 'mcp-2',
          name: 'liftshelf200',
          fromSystem: 'WMS',
          continueTaskDelaySec: null,
        },
      },
    }),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const usersRepository = {
    findById: jest.fn().mockResolvedValue({ id: 'user-1', priority: 4 }),
  };

  const warehouseLocationsRepository = {
    findActiveByLocationCode: jest
      .fn()
      .mockResolvedValue(
        pickupIsWarehouse ? { id: 'wl-1', iRaypleLocationCode: SCAN } : null,
      ),
    findFirstActiveEmpty: jest
      .fn()
      .mockResolvedValue({ id: 'wl-2', iRaypleLocationCode: 'WRL22' }),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const productionLocationsRepository = {
    findActiveByLocationCode: jest
      .fn()
      .mockResolvedValue({ id: 'pl-1', iRaypleLocationCode: DROP }),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const trolleyActivitiesRepository = {
    findOpenByTrolleyId: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'activity-1' }),
    completeById: jest.fn().mockResolvedValue({ id: 'activity-1' }),
  };

  const addTask = jest.fn().mockResolvedValue({ code: 1000 });
  const taskOrderService = { addTask };
  const rcsStockStatusService = {
    updateStockStatus: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new CreateTrolleyActivityUseCase(
    trolleysRepository as never,
    usersRepository as never,
    warehouseLocationsRepository as never,
    productionLocationsRepository as never,
    trolleyActivitiesRepository as never,
    taskOrderService as never,
    rcsStockStatusService as never,
  );

  const dto = {
    trolleyId: 'trolley-1',
    pickupLocationCode: SCAN,
    startDate: '2026-11-18T01:00:00.000Z',
    queueRole: 'Warehouse' as const,
  };

  return { useCase, dto, addTask, trolleyActivitiesRepository };
}

/** The taskPath actually sent to RCS. */
function sentPath(addTask: jest.Mock): string {
  return addTask.mock.calls[0][0].taskOrderDetail[0].taskPath;
}

describe('CreateTrolleyActivityUseCase — the route it sends', () => {
  describe('Warehouse -> Production with a transit stop', () => {
    // The stop is named twice on purpose: the trolley is put down there
    // and the order parks, then after the continue it is picked up again
    // and taken on to the dropping point. One leg would only describe
    // arriving, so this is the assertion that must not be "tidied".
    it('sends four legs, naming the stop twice', async () => {
      const { useCase, dto, addTask } = build({
        transitLocationCode: TRANSIT,
      });
      await useCase.execute(dto, 'user-1');
      expect(sentPath(addTask)).toBe(`${SCAN},${TRANSIT},${TRANSIT},${DROP}`);
    });

    it('names it twice even when the stop is the dropping point itself', async () => {
      // Nothing stops an admin pointing both at the same node, and the
      // route still has to describe put-down, wait, pick-up, deliver.
      const { useCase, dto, addTask } = build({
        transitLocationCode: DROP,
      });
      await useCase.execute(dto, 'user-1');
      expect(sentPath(addTask)).toBe(`${SCAN},${DROP},${DROP},${DROP}`);
    });

    it('records the stop and the wait on the activity', async () => {
      const { useCase, dto, trolleyActivitiesRepository } = build({
        transitLocationCode: TRANSIT,
        continueTaskDelaySec: 45,
      });
      await useCase.execute(dto, 'user-1');
      expect(trolleyActivitiesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transitLocationCode: TRANSIT,
          continueTaskDelaySec: 45,
        }),
      );
    });

    // Without a timer nothing would ever continue the order, and the AMR
    // would hold the trolley at the stop with no way to release it.
    it('refuses the submit when the Model Code Process has no timer', async () => {
      const { useCase, dto, addTask } = build({
        transitLocationCode: TRANSIT,
        continueTaskDelaySec: null,
      });
      await expect(useCase.execute(dto, 'user-1')).rejects.toThrow(
        /no Continue Task Timer/,
      );
      expect(addTask).not.toHaveBeenCalled();
    });
  });

  describe('Warehouse -> Production without one', () => {
    it('still sends two legs', async () => {
      const { useCase, dto, addTask } = build({ transitLocationCode: null });
      await useCase.execute(dto, 'user-1');
      expect(sentPath(addTask)).toBe(`${SCAN},${DROP}`);
    });

    it('does not need a timer at all', async () => {
      const { useCase, dto, addTask } = build({
        transitLocationCode: null,
        continueTaskDelaySec: null,
      });
      await useCase.execute(dto, 'user-1');
      expect(addTask).toHaveBeenCalled();
    });

    it('records no stop and no wait', async () => {
      const { useCase, dto, trolleyActivitiesRepository } = build({
        transitLocationCode: null,
      });
      await useCase.execute(dto, 'user-1');
      expect(trolleyActivitiesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transitLocationCode: null,
          continueTaskDelaySec: null,
        }),
      );
    });
  });

  // The other direction sends one node and lets RCS choose the rest, so
  // there is no route here to insert a stop into — a trolley configured
  // with one is simply unaffected when it is brought back.
  describe('Production -> Warehouse', () => {
    it('sends the pickup node alone, stop or no stop', async () => {
      const { useCase, dto, addTask } = build({
        transitLocationCode: TRANSIT,
        pickupIsWarehouse: false,
      });
      await useCase.execute({ ...dto, pickupLocationCode: DROP }, 'user-1');
      expect(sentPath(addTask)).toBe(DROP);
    });

    it('is not refused by the missing-timer rule', async () => {
      const { useCase, dto, addTask } = build({
        transitLocationCode: TRANSIT,
        continueTaskDelaySec: null,
        pickupIsWarehouse: false,
      });
      await useCase.execute({ ...dto, pickupLocationCode: DROP }, 'user-1');
      expect(addTask).toHaveBeenCalled();
    });
  });
});
