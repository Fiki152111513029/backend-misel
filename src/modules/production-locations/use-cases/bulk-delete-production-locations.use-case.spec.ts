import { BulkDeleteProductionLocationsUseCase } from './bulk-delete-production-locations.use-case';

// A selection is made against a list loaded seconds or minutes ago, so by
// the time Delete is pressed some of it may already be gone. These pin down
// that the batch still goes through and reports the shortfall, rather than
// refusing everything over one stale id.

function build(softDeleteMany: jest.Mock) {
  return new BulkDeleteProductionLocationsUseCase({ softDeleteMany } as never);
}

describe('BulkDeleteProductionLocationsUseCase', () => {
  it('deletes the ids it is given and reports the count', async () => {
    const softDeleteMany = jest.fn().mockResolvedValue(3);
    const result = await build(softDeleteMany).execute(['a', 'b', 'c']);

    expect(softDeleteMany).toHaveBeenCalledWith(['a', 'b', 'c']);
    expect(result).toEqual({ deleted: 3, missing: 0 });
  });

  it('reports ids that matched nothing instead of failing the batch', async () => {
    // Two of the three were already deleted by someone else.
    const softDeleteMany = jest.fn().mockResolvedValue(1);
    const result = await build(softDeleteMany).execute(['a', 'b', 'c']);

    expect(result).toEqual({ deleted: 1, missing: 2 });
  });

  // Without this, one id sent twice would count once against the repository
  // and twice against the input, reporting a phantom missing row.
  it('counts a repeated id once', async () => {
    const softDeleteMany = jest.fn().mockResolvedValue(2);
    const result = await build(softDeleteMany).execute(['a', 'b', 'a']);

    expect(softDeleteMany).toHaveBeenCalledWith(['a', 'b']);
    expect(result).toEqual({ deleted: 2, missing: 0 });
  });

  it('asks for nothing and reports nothing on an empty list', async () => {
    // The DTO rejects this before it ever gets here; the guard is that the
    // use-case itself does not invent a row count from an empty input.
    const softDeleteMany = jest.fn().mockResolvedValue(0);
    const result = await build(softDeleteMany).execute([]);

    expect(result).toEqual({ deleted: 0, missing: 0 });
  });
});
