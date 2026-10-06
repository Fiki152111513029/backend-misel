import { BadRequestException } from '@nestjs/common';
import { assertWarehouseBinsReady } from './assert-warehouse-bins-ready';
import type { RcsStockStatusService } from '../../rcs-stock-status/rcs-stock-status.service';
import type { IFactoryMapsRepository } from '../../factory-maps/repositories/factory-map-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';

// The RCS instance available in development does not know these bin codes,
// so the blocking paths cannot be exercised against the live server. These
// cover them directly.
//
// The rule under test: a Warehouse Location at the START of the route is a
// pickup and must be FULL (2); at the END it is a drop and must be EMPTY
// (0). Same node, opposite requirements.

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

describe('assertWarehouseBinsReady', () => {
  describe('pickup — the warehouse node at the start of the route', () => {
    it('refuses it when RCS reports it empty', async () => {
      await expect(
        assertWarehouseBinsReady(deps({ [WRL12]: EMPTY }), [WRL12, PT2A]),
      ).rejects.toThrow(BadRequestException);
    });

    it('explains it as a pickup with nothing to collect', async () => {
      await expect(
        assertWarehouseBinsReady(deps({ [WRL12]: EMPTY }), [WRL12, PT2A]),
      ).rejects.toThrow(/Empty pallet not ready.*WRL12.*pickup point/s);
    });

    it('allows it when RCS reports it full', async () => {
      await expect(
        assertWarehouseBinsReady(deps({ [WRL12]: FULL }), [WRL12, PT2A]),
      ).resolves.toBeUndefined();
    });
  });

  describe('drop — the warehouse node at the end of the route', () => {
    it('refuses it when RCS reports it full', async () => {
      await expect(
        assertWarehouseBinsReady(deps({ [WRL12]: FULL }), [PT2A, WRL12]),
      ).rejects.toThrow(BadRequestException);
    });

    it('explains it as a drop with nowhere to put the load', async () => {
      await expect(
        assertWarehouseBinsReady(deps({ [WRL12]: FULL }), [PT2A, WRL12]),
      ).rejects.toThrow(/Drop location not free.*WRL12.*drop point/s);
    });

    it('allows it when RCS reports it empty', async () => {
      await expect(
        assertWarehouseBinsReady(deps({ [WRL12]: EMPTY }), [PT2A, WRL12]),
      ).resolves.toBeUndefined();
    });
  });

  describe('both ends at once', () => {
    it('allows a full pickup into an empty drop', async () => {
      await expect(
        assertWarehouseBinsReady(deps({ [WRL12]: FULL, [WRL13]: EMPTY }), [
          WRL12,
          PT2A,
          WRL13,
        ]),
      ).resolves.toBeUndefined();
    });

    it('refuses when the drop is full even though the pickup is fine', async () => {
      await expect(
        assertWarehouseBinsReady(deps({ [WRL12]: FULL, [WRL13]: FULL }), [
          WRL12,
          PT2A,
          WRL13,
        ]),
      ).rejects.toThrow(/Drop location not free.*WRL13/s);
    });

    it('refuses when the pickup is empty even though the drop is fine', async () => {
      await expect(
        assertWarehouseBinsReady(deps({ [WRL12]: EMPTY, [WRL13]: EMPTY }), [
          WRL12,
          PT2A,
          WRL13,
        ]),
      ).rejects.toThrow(/Empty pallet not ready.*WRL12/s);
    });

    // The same node at both ends: it is collected from and returned to, so
    // only the pickup requirement can meaningfully be checked up front.
    it('treats a route that starts and ends on the same node as a pickup', async () => {
      await expect(
        assertWarehouseBinsReady(deps({ [WRL12]: FULL }), [WRL12, PT2A, WRL12]),
      ).resolves.toBeUndefined();
    });
  });

  describe('what it deliberately does not check', () => {
    it('ignores a warehouse node in the middle of the route', async () => {
      // WRL13 sits mid-route and is full, which would block if it were the
      // drop — it is only driven through, so it must not.
      await expect(
        assertWarehouseBinsReady(deps({ [WRL12]: FULL, [WRL13]: FULL }), [
          WRL12,
          WRL13,
          PT2A,
        ]),
      ).resolves.toBeUndefined();
    });

    it('ignores production legs at either end', async () => {
      await expect(
        assertWarehouseBinsReady(deps({ [PT2A]: FULL }), [PT2A, PT2A]),
      ).resolves.toBeUndefined();
    });

    it('fails open when RCS reports nothing for the end node', async () => {
      await expect(
        assertWarehouseBinsReady(deps({}), [WRL12, PT2A]),
      ).resolves.toBeUndefined();
    });

    it('never asks RCS when neither end is a warehouse node', async () => {
      const d = deps({});
      await assertWarehouseBinsReady(d, [PT2A, WRL13, PT2A]);
      expect(d.getStockStatusByCode).not.toHaveBeenCalled();
    });

    it('asks RCS only about areas that actually have an areaNumber', async () => {
      const d = deps({ [WRL12]: FULL });
      await assertWarehouseBinsReady(d, [WRL12, PT2A]);
      expect(d.getStockStatusByCode).toHaveBeenCalledWith([1, 2]);
    });

    it('does nothing for an empty route', async () => {
      const d = deps({});
      await expect(assertWarehouseBinsReady(d, [])).resolves.toBeUndefined();
      expect(d.getStockStatusByCode).not.toHaveBeenCalled();
    });
  });
});
