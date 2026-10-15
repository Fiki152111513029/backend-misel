import { checkPickupBinReady } from './check-pickup-bin-ready';
import type { RcsStockStatusService } from '../../rcs-stock-status/rcs-stock-status.service';
import type { IFactoryMapsRepository } from '../../factory-maps/repositories/factory-map-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';

// The RCS instance available in development does not know these bin codes,
// so the blocking paths cannot be exercised against the live server. These
// cover them directly.
//
// The rule under test: a Warehouse Location at the START of the route is a
// pickup and must be FULL (2); an empty one comes back as not-ready so the
// caller can hold the task. The END of the route is not checked at all — a
// drop goes out whatever the bin holds.

const READY = { ready: true };
const notReady = (code: string) => ({ ready: false, code });

const WRL12 = 'WRL12';
const WRL13 = 'WRL13';
const PT2A = 'PT2A'; // a Production Location — never checked

const FULL = 2;
const EMPTY = 0;

function deps(stock: Record<string, number>) {
  const warehouseLocationsRepository = {
    findAll: jest.fn().mockResolvedValue({
      items: [WRL12, WRL13].map((code, index) => ({
        id: `id-${index}`,
        name: code,
        iRaypleLocationCode: code,
        isActive: true,
        deletedAt: null,
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

describe('checkPickupBinReady', () => {
  describe('pickup — the warehouse node at the start of the route', () => {
    it('reports not-ready when RCS says the bin is empty', async () => {
      await expect(
        checkPickupBinReady(deps({ [WRL12]: EMPTY }), [WRL12, PT2A]),
      ).resolves.toEqual(notReady(WRL12));
    });

    it('names the bin it is waiting on, so the caller can report it', async () => {
      await expect(
        checkPickupBinReady(deps({ [WRL12]: EMPTY }), [WRL12, PT2A]),
      ).resolves.toEqual(notReady(WRL12));
    });

    it('allows it when RCS reports it full', async () => {
      await expect(
        checkPickupBinReady(deps({ [WRL12]: FULL }), [WRL12, PT2A]),
      ).resolves.toEqual(READY);
    });
  });

  describe('drop — the warehouse node at the end of the route', () => {
    // The point of the change: a full drop bin used to refuse the task.
    it('allows it when RCS reports it full', async () => {
      await expect(
        checkPickupBinReady(deps({ [WRL12]: FULL }), [PT2A, WRL12]),
      ).resolves.toEqual(READY);
    });

    it('allows it when RCS reports it empty', async () => {
      await expect(
        checkPickupBinReady(deps({ [WRL12]: EMPTY }), [PT2A, WRL12]),
      ).resolves.toEqual(READY);
    });

    it('never asks RCS at all when only the drop end is a warehouse node', async () => {
      const d = deps({ [WRL12]: FULL });
      await checkPickupBinReady(d, [PT2A, WRL12]);
      expect(d.getStockStatusByCode).not.toHaveBeenCalled();
    });
  });

  describe('both ends at once', () => {
    it('allows a full pickup into an empty drop', async () => {
      await expect(
        checkPickupBinReady(deps({ [WRL12]: FULL, [WRL13]: EMPTY }), [
          WRL12,
          PT2A,
          WRL13,
        ]),
      ).resolves.toEqual(READY);
    });

    it('allows a full pickup into a full drop', async () => {
      await expect(
        checkPickupBinReady(deps({ [WRL12]: FULL, [WRL13]: FULL }), [
          WRL12,
          PT2A,
          WRL13,
        ]),
      ).resolves.toEqual(READY);
    });

    it('still reports not-ready when the pickup is empty, whatever the drop holds', async () => {
      await expect(
        checkPickupBinReady(deps({ [WRL12]: EMPTY, [WRL13]: EMPTY }), [
          WRL12,
          PT2A,
          WRL13,
        ]),
      ).resolves.toEqual(notReady(WRL12));
    });

    // The same node at both ends: it is collected from and returned to, so
    // the pickup requirement is the one that applies.
    it('treats a route that starts and ends on the same node as a pickup', async () => {
      await expect(
        checkPickupBinReady(deps({ [WRL12]: FULL }), [WRL12, PT2A, WRL12]),
      ).resolves.toEqual(READY);
    });

    it('reports not-ready for that same round trip when the node is empty', async () => {
      await expect(
        checkPickupBinReady(deps({ [WRL12]: EMPTY }), [
          WRL12,
          PT2A,
          WRL12,
        ]),
      ).resolves.toEqual(notReady(WRL12));
    });
  });

  describe('what it deliberately does not check', () => {
    it('ignores a warehouse node in the middle of the route', async () => {
      // WRL13 sits mid-route and is empty, which would block if it were
      // the pickup — it is only driven through, so it must not.
      await expect(
        checkPickupBinReady(deps({ [WRL12]: FULL, [WRL13]: EMPTY }), [
          WRL12,
          WRL13,
          PT2A,
        ]),
      ).resolves.toEqual(READY);
    });

    it('ignores production legs at either end', async () => {
      await expect(
        checkPickupBinReady(deps({ [PT2A]: FULL }), [PT2A, PT2A]),
      ).resolves.toEqual(READY);
    });

    it('fails open when RCS reports nothing for the pickup node', async () => {
      await expect(
        checkPickupBinReady(deps({}), [WRL12, PT2A]),
      ).resolves.toEqual(READY);
    });

    it('never asks RCS when the route does not start on a warehouse node', async () => {
      const d = deps({});
      await checkPickupBinReady(d, [PT2A, WRL13, PT2A]);
      expect(d.getStockStatusByCode).not.toHaveBeenCalled();
    });

    it('asks RCS only about areas that actually have an areaNumber', async () => {
      const d = deps({ [WRL12]: FULL });
      await checkPickupBinReady(d, [WRL12, PT2A]);
      expect(d.getStockStatusByCode).toHaveBeenCalledWith([1, 2]);
    });

    it('does nothing for an empty route', async () => {
      const d = deps({});
      await expect(checkPickupBinReady(d, [])).resolves.toEqual(READY);
      expect(d.getStockStatusByCode).not.toHaveBeenCalled();
    });
  });
});
