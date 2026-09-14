import { Inject, Injectable } from '@nestjs/common';
import { SHIFTS_REPOSITORY } from '../repositories/shift-repository.interface';
import type { IShiftsRepository } from '../repositories/shift-repository.interface';
import { fetchActiveShifts } from '../utils/active-shifts.util';
import {
  shiftBounds,
  startOfUtcDay,
} from '../../robots/utils/robot-status-day';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Which active Shift's window (see shiftBounds — already accounts for the
// weekly A/B rotation) contains this exact moment. Powers the shift filter
// on AMR Performance / Trolley Activities charts, which default to and
// automatically follow whichever shift is actually running right now
// instead of an arbitrary first-in-list pick.
@Injectable()
export class GetCurrentShiftUseCase {
  constructor(
    @Inject(SHIFTS_REPOSITORY)
    private readonly shiftsRepository: IShiftsRepository,
  ) {}

  async execute(): Promise<{ shiftId: string | null }> {
    const activeShifts = await fetchActiveShifts(this.shiftsRepository);
    if (activeShifts.length === 0) return { shiftId: null };

    const now = new Date();
    const todayStart = startOfUtcDay(now);
    // A shift anchored on yesterday can still be running right now (e.g. a
    // 19:00-04:30 shift's window extends into today) — check both anchors.
    const yesterdayStart = new Date(todayStart.getTime() - ONE_DAY_MS);

    for (const anchor of [todayStart, yesterdayStart]) {
      for (const shift of activeShifts) {
        const { from, to } = shiftBounds(anchor, shift, activeShifts);
        if (now >= from && now < to) {
          return { shiftId: shift.id };
        }
      }
    }
    return { shiftId: null };
  }
}
