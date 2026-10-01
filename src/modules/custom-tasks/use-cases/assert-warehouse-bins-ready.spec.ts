import { BadRequestException } from '@nestjs/common';
import { assertWarehouseBinsReady } from './assert-warehouse-bins-ready';
import type { RcsStockStatusService } from '../../rcs-stock-status/rcs-stock-status.service';
import type { IFactoryMapsRepository } from '../../factory-maps/repositories/factory-map-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';

// The RCS instance available in development does not know these bin codes,
// so the blocking path cannot be exercised against the live server. These
// cover it directly instead.

const WAREHOUSE_CODES = ['WHA1', 'WHA2'];
const PRODUCTION_CODE = 'T1B';

function deps(stock: Record<string, number>) {
  const warehouseLocationsRepository = {
    findAll: jest.fn().mockResolvedValue({
      items: WAREHOUSE_CODES.map((code, index) => ({
        id: `id-${index}`,
        name: code,
        iRaypleLocationCode: code,
        isActive: true,
        deletedAt: null,
      })),
      total: WAREHOUSE_CODES.length,
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
  // The AMR collects an empty pallet from the bin, so FULL (2) is the ready
  // state and EMPTY (0) is what blocks — there is nothing there to collect.
  it('refuses a route whose warehouse bin RCS reports as empty (0)', async () => {
    await expect(
      assertWarehouseBinsReady(deps({ WHA1: 0 }), [PRODUCTION_CODE, 'WHA1']),
    ).rejects.toThrow(BadRequestException);
  });

  it('names the offending bin in the message', async () => {
    await expect(
      assertWarehouseBinsReady(deps({ WHA1: 0 }), ['WHA1']),
    ).rejects.toThrow(/Empty pallet not ready.*WHA1/s);
  });

  it('allows a route whose warehouse bin is full (2)', async () => {
    await expect(
      assertWarehouseBinsReady(deps({ WHA1: 2 }), [PRODUCTION_CODE, 'WHA1']),
    ).resolves.toBeUndefined();
  });

  it('ignores production legs even when RCS calls them empty', async () => {
    await expect(
      assertWarehouseBinsReady(deps({ [PRODUCTION_CODE]: 0 }), [
        PRODUCTION_CODE,
        PRODUCTION_CODE,
      ]),
    ).resolves.toBeUndefined();
  });

  it('fails open when RCS reports nothing for the bin', async () => {
    await expect(
      assertWarehouseBinsReady(deps({}), [PRODUCTION_CODE, 'WHA1']),
    ).resolves.toBeUndefined();
  });

  it('checks a repeated leg once and still blocks on it', async () => {
    const d = deps({ WHA1: 0 });
    await expect(
      assertWarehouseBinsReady(d, ['WHA1', PRODUCTION_CODE, 'WHA1']),
    ).rejects.toThrow(/WHA1/);
  });

  it('reports every empty bin on the route, not just the first', async () => {
    await expect(
      assertWarehouseBinsReady(deps({ WHA1: 0, WHA2: 0 }), ['WHA1', 'WHA2']),
    ).rejects.toThrow(/WHA1, WHA2/);
  });

  it('lets a mixed route through as long as every warehouse bin is full', async () => {
    await expect(
      assertWarehouseBinsReady(deps({ WHA1: 2, WHA2: 2 }), [
        'WHA1',
        PRODUCTION_CODE,
        'WHA2',
      ]),
    ).resolves.toBeUndefined();
  });

  it('never asks RCS when the route has no warehouse leg at all', async () => {
    const d = deps({});
    await assertWarehouseBinsReady(d, [PRODUCTION_CODE, PRODUCTION_CODE]);
    expect(d.getStockStatusByCode).not.toHaveBeenCalled();
  });

  it('asks RCS only about areas that actually have an areaNumber', async () => {
    const d = deps({ WHA1: 2 });
    await assertWarehouseBinsReady(d, ['WHA1']);
    expect(d.getStockStatusByCode).toHaveBeenCalledWith([1, 2]);
  });
});
