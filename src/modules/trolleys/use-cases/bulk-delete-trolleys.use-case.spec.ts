import { BulkDeleteTrolleysUseCase } from './bulk-delete-trolleys.use-case';

// Bulk delete is destructive and the arithmetic is what the operator reads
// afterwards, so it is worth pinning: deleted comes from the database, and
// missing is everything asked for that the database did not match.

function build(deleted: number) {
  const softDeleteMany = jest.fn().mockResolvedValue(deleted);
  const useCase = new BulkDeleteTrolleysUseCase({
    softDeleteMany,
  } as never);
  return { useCase, softDeleteMany };
}

describe('BulkDeleteTrolleysUseCase', () => {
  it('reports what the database actually deleted', async () => {
    const { useCase } = build(3);
    await expect(useCase.execute(['a', 'b', 'c'])).resolves.toEqual({
      deleted: 3,
      missing: 0,
    });
  });

  // Someone else removed one while the selection sat on screen. The other
  // two still go, and the count says so rather than the request failing.
  it('counts ids the database did not match as missing', async () => {
    const { useCase } = build(2);
    await expect(useCase.execute(['a', 'b', 'c'])).resolves.toEqual({
      deleted: 2,
      missing: 1,
    });
  });

  it('de-duplicates before counting, so a repeated id is not a phantom miss', async () => {
    const { useCase, softDeleteMany } = build(1);
    await expect(useCase.execute(['a', 'a'])).resolves.toEqual({
      deleted: 1,
      missing: 0,
    });
    expect(softDeleteMany).toHaveBeenCalledWith(['a']);
  });
});
