import { ForbiddenException } from '@nestjs/common';
import { LineStatusKind } from '@prisma/client';
import { RaiseLineStatusUseCase } from './raise-line-status.use-case';

// The group arrives in the request body, so the only thing standing
// between any signed-in operator and announcing a changeover on a line
// they have never worked is the check these cover.

const USER = 'user-1';

function build(
  assigned: { groupName: string | null; lineStatusEnabled: boolean }[],
) {
  const upsert = jest.fn().mockImplementation((groupName, kind) =>
    Promise.resolve({
      id: 'line-status-1',
      groupName,
      kind,
      raisedById: USER,
      createdAt: new Date('2026-11-06T07:00:00Z'),
      updatedAt: new Date('2026-11-06T07:00:00Z'),
      raisedBy: { id: USER, username: 'opr', fullName: 'Operator Satu' },
    }),
  );
  const publish = jest.fn();

  const useCase = new RaiseLineStatusUseCase(
    { findAll: jest.fn(), upsert, clear: jest.fn() },
    {
      findAssignedToUser: jest.fn().mockResolvedValue(assigned),
    } as never,
    { publish } as never,
  );

  return { useCase, upsert, publish };
}

describe('RaiseLineStatusUseCase', () => {
  it('announces for a group the operator works that has the buttons on', async () => {
    const { useCase, upsert, publish } = build([
      { groupName: 'WRL31', lineStatusEnabled: true },
    ]);

    const result = await useCase.execute(
      USER,
      'WRL31',
      LineStatusKind.RUNNING_LH,
    );

    expect(upsert).toHaveBeenCalledWith('WRL31', 'RUNNING_LH', USER);
    expect(publish).toHaveBeenCalledWith('line-status');
    expect(result).toEqual({
      groupName: 'WRL31',
      kind: 'RUNNING_LH',
      raisedBy: 'Operator Satu',
      at: '2026-11-06T07:00:00.000Z',
    });
  });

  it('refuses a group the operator has no task in', async () => {
    const { useCase, upsert } = build([
      { groupName: 'WRL23L', lineStatusEnabled: true },
    ]);

    await expect(
      useCase.execute(USER, 'WRL31', LineStatusKind.CHANGE_RH),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(upsert).not.toHaveBeenCalled();
  });

  // Switching the flag off is how an admin retires the buttons. The picker
  // stops drawing them, but a phone left open on the old page would still
  // have them on screen, so the press has to be refused here too.
  it('refuses a group whose buttons were switched off', async () => {
    const { useCase, upsert } = build([
      { groupName: 'WRL31', lineStatusEnabled: false },
    ]);

    await expect(
      useCase.execute(USER, 'WRL31', LineStatusKind.RUNNING_LH),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(upsert).not.toHaveBeenCalled();
  });

  // "Other" in the picker is the bucket for tasks with no group at all, so
  // it is not a line and cannot be announced for even by name.
  it('refuses when the operator only has ungrouped tasks', async () => {
    const { useCase, upsert } = build([
      { groupName: null, lineStatusEnabled: true },
    ]);

    await expect(
      useCase.execute(USER, 'Other', LineStatusKind.RUNNING_RH),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(upsert).not.toHaveBeenCalled();
  });
});
