import { Shift } from '@prisma/client';
import type { IShiftsRepository } from '../repositories/shift-repository.interface';

// The "fetch all" convention used across this codebase for populating an
// internal classification/lookup set (see trolley-shift-summary.util.ts's
// fetchActiveWarehouseLocationCodes) — a high limit in place of true
// pagination, since every active Shift is needed to compute shift
// boundaries and weekly rotation (see robots/utils/robot-status-day.ts),
// not to render a paginated list.
export async function fetchActiveShifts(
  shiftsRepository: IShiftsRepository,
): Promise<Shift[]> {
  const { items } = await shiftsRepository.findAll({
    page: 1,
    limit: 1000,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  return items.filter((shift) => shift.isActive);
}
