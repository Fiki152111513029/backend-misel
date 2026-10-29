import { checkRouteBins } from './check-route-bins';
import type { RcsStockStatusService } from '../../rcs-stock-status/rcs-stock-status.service';
import type { IFactoryMapsRepository } from '../../factory-maps/repositories/factory-map-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';

// The RCS instance available in development does not know these bin codes,
// so the blocking paths cannot be exercised against the live server. These
// cover them directly.
//
// The rule under test: a Warehouse Location at the START of the route is a
// pickup and must be FULL (2); at the END it is a drop and must be EMPTY
// (0). Either one wrong comes back as not-ready, naming the code and the
// status that would release it, so the caller can park the task.

const READY = { ready: true };
const needFull = (code: string) => ({
  ready: false,
  code,
  needStatus: '2',
  role: 'pickup',
});
const needEmpty = (code: string) => ({
  ready: false,
  code,
  needStatus: '0',
  role: 'drop',
});

const WRL12 = 'WRL12';
const WRL13 = 'WRL13';
const PT2A = 'PT2A'; // a Production Location — never checked

const FULL = 2;
const EMPTY = 0;

function deps(
  stock: Record<string, number>,
  /** Codes physically holding finished goods — RCS still reports them 0. */
  finishGoods: string[] = [],
) {
  const warehouseLocationsRepository = {
    findAll: jest.fn().mockResolvedValue({
      items: [WRL12, WRL13].map((code, index) => ({
        id: `id-${index}`,
        name: code,
        iRaypleLocationCode: code,
        isActive: true,
        deletedAt: null,
        binContent: finishGoods.includes(code) ? 'FINISH_GOOD' : null,
      })),
      total: 2,
    }),
  } as unknown as IWarehouseLocationsRepository;

  const factoryMapsRepository = {
    findAll: jest.fn().mockResolvedValue({
      items: [{ areaNumber: 1 }, { areaNumber: 2 }, { areaNumber: null }],
      total: 3,
    }),
  } as unknown as IFactoryMapsRepository;

  const getStockStatusByCode = jest
    .fn()
    .mockResolvedValue(new Map(Object.entries(stock)));
  const rcsStockStatusService = {
    getStockStatusByCode,
  } as unknown as RcsStockStatusService;

  return {
    warehouseLocationsRepository,
    factoryMapsRepository,
    rcsStockStatusService,
    getStockStatusByCode,
  };
}

describe('checkRouteBins', () => {
  describe('pickup — the warehouse node at the start of the route', () => {
    it('reports not-ready when RCS says the bin is empty', async () => {
      await expect(
        checkRouteBins(deps({ [WRL12]: EMPTY }), [WRL12, PT2A]),
      ).resolves.toEqual(needFull(WRL12));
    });

    it('names the bin it is waiting on, so the caller can report it', async () => {
      await expect(
        checkRouteBins(deps({ [WRL12]: EMPTY }), [WRL12, PT2A]),
      ).resolves.toEqual(needFull(WRL12));
    });

    it('allows it when RCS reports it full', async () => {
      await expect(
        checkRouteBins(deps({ [WRL12]: FULL }), [WRL12, PT2A]),
      ).resolves.toEqual(READY);
    });
  });

  describe('drop — the warehouse node at the end of the route', () => {
    it('reports not-ready when RCS says the slot is full', async () => {
      await expect(
        checkRouteBins(deps({ [WRL12]: FULL }), [PT2A, WRL12]),
      ).resolves.toEqual(needEmpty(WRL12));
    });

    it('allows it when RCS reports it empty', async () => {
      await expect(
        checkRouteBins(deps({ [WRL12]: EMPTY }), [PT2A, WRL12]),
      ).resolves.toEqual(READY);
    });

    it('asks RCS even when only the drop end is a warehouse node', async () => {
      const d = deps({ [WRL12]: EMPTY });
      await checkRouteBins(d, [PT2A, WRL12]);
      expect(d.getStockStatusByCode).toHaveBeenCalled();
    });
  });

  describe('both ends at once', () => {
    it('allows a full pickup into an empty drop', async () => {
      await expect(
        checkRouteBins(deps({ [WRL12]: FULL, [WRL13]: EMPTY }), [
          WRL12,
          PT2A,
          WRL13,
        ]),
      ).resolves.toEqual(READY);
    });

    it('holds a full pickup when the drop is also full', async () => {
      await expect(
        checkRouteBins(deps({ [WRL12]: FULL, [WRL13]: FULL }), [
          WRL12,
          PT2A,
          WRL13,
        ]),
      ).resolves.toEqual(needEmpty(WRL13));
    });

    // Both ends wrong: the pickup is the one worth waiting on, because a
    // task cannot deliver what it never collected.
    it('reports the pickup first when both ends are wrong', async () => {
      await expect(
        checkRouteBins(deps({ [WRL12]: EMPTY, [WRL13]: FULL }), [
          WRL12,
          PT2A,
          WRL13,
        ]),
      ).resolves.toEqual(needFull(WRL12));
    });

    it('still reports not-ready when the pickup is empty, whatever the drop holds', async () => {
      await expect(
        checkRouteBins(deps({ [WRL12]: EMPTY, [WRL13]: EMPTY }), [
          WRL12,
          PT2A,
          WRL13,
        ]),
      ).resolves.toEqual(needFull(WRL12));
    });

    // The same node at both ends: it is collected from and returned to, so
    // the pickup requirement is the one that applies.
    it('treats a route that starts and ends on the same node as a pickup', async () => {
      await expect(
        checkRouteBins(deps({ [WRL12]: FULL }), [WRL12, PT2A, WRL12]),
      ).resolves.toEqual(READY);
    });

    it('reports not-ready for that same round trip when the node is empty', async () => {
      await expect(
        checkRouteBins(deps({ [WRL12]: EMPTY }), [
          WRL12,
          PT2A,
          WRL12,
        ]),
      ).resolves.toEqual(needFull(WRL12));
    });
  });

  describe('a drop node holding finished goods', () => {
    // RCS reports these as 0 because its 2 means "empty rack ready to
    // collect". The node is still physically taken, so a drop has to wait.
    it('holds the task even though RCS says the slot is empty', async () => {
      await expect(
        checkRouteBins(deps({ [WRL12]: EMPTY }, [WRL12]), [PT2A, WRL12]),
      ).resolves.toEqual(needEmpty(WRL12));
    });

    it('allows the drop once the goods have been collected', async () => {
      await expect(
        checkRouteBins(deps({ [WRL12]: EMPTY }, []), [PT2A, WRL12]),
      ).resolves.toEqual(READY);
    });

    // The pickup rule is untouched: finished goods leave RCS at 0, and a
    // pickup needs 2, so they can never be collected as an empty rack.
    it('is never offered up as an empty rack to collect', async () => {
      await expect(
        checkRouteBins(deps({ [WRL12]: EMPTY }, [WRL12]), [WRL12, PT2A]),
      ).resolves.toEqual(needFull(WRL12));
    });
  });

  describe('what it deliberately does not check', () => {
    it('ignores a warehouse node in the middle of the route', async () => {
      // WRL13 sits mid-route and is empty, which would block if it were
      // the pickup — it is only driven through, so it must not.
      await expect(
        checkRouteBins(deps({ [WRL12]: FULL, [WRL13]: EMPTY }), [
          WRL12,
          WRL13,
          PT2A,
        ]),
      ).resolves.toEqual(READY);
    });

    it('ignores production legs at either end', async () => {
      await expect(
        checkRouteBins(deps({ [PT2A]: FULL }), [PT2A, PT2A]),
      ).resolves.toEqual(READY);
    });

    it('fails open when RCS reports nothing for the pickup node', async () => {
      await expect(
        checkRouteBins(deps({}), [WRL12, PT2A]),
      ).resolves.toEqual(READY);
    });

    it('never asks RCS when neither end is a warehouse node', async () => {
      const d = deps({});
      await checkRouteBins(d, [PT2A, WRL13, PT2A]);
      expect(d.getStockStatusByCode).not.toHaveBeenCalled();
    });

    it('asks RCS only about areas that actually have an areaNumber', async () => {
      const d = deps({ [WRL12]: FULL });
      await checkRouteBins(d, [WRL12, PT2A]);
      expect(d.getStockStatusByCode).toHaveBeenCalledWith([1, 2]);
    });

    it('does nothing for an empty route', async () => {
      const d = deps({});
      await expect(checkRouteBins(d, [])).resolves.toEqual(READY);
      expect(d.getStockStatusByCode).not.toHaveBeenCalled();
    });
  });
});
