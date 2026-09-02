import { RobotShift } from '@prisma/client';

// Every "day" in the robot-status feature (RobotStatusRollupService,
// GetRobotStatusSummaryUseCase) is a UTC calendar day — the rest of this
// codebase has no timezone-conversion convention to follow, so UTC keeps
// day boundaries unambiguous and consistent with how Date values are
// otherwise stored/compared.
export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

// Parses a "YYYY-MM-DD" query param into that UTC day's start — throws
// (via an invalid Date) on anything malformed, which callers should guard
// with Number.isNaN(result.getTime()).
export function parseUtcDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(NaN);
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

// Parses a "YYYY-MM" query param into that UTC month's first day — same
// invalid-Date-on-malformed-input contract as parseUtcDateOnly.
export function parseUtcMonthOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return new Date(NaN);
  const [, year, month] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1));
}

// Exclusive end of the UTC month that `monthStart` (see parseUtcMonthOnly)
// falls in.
export function endOfUtcMonth(monthStart: Date): Date {
  return new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1),
  );
}

// Two work shifts, both WIB (Asia/Jakarta, UTC+7) — Sesi 1 normally runs
// 07:00-16:15, Sesi 2 07:15-16:30, but either can run into overtime some
// days, so the window actually tracked/queried extends to 21:00 WIB rather
// than cutting off at the normal finish time. WIB is UTC+7, so 07:00 WIB
// lines up with 00:00 UTC of the same calendar date — i.e. exactly
// startOfUtcDay(date) — and every other clock time here is expressed as an
// offset from that same UTC midnight.
const OVERTIME_CUTOFF_OFFSET_MS = 14 * 60 * 60 * 1000; // 21:00 WIB

const SHIFT_START_OFFSET_MS: Record<RobotShift, number> = {
  SESI_1: 0, // 07:00 WIB
  SESI_2: 0.25 * 60 * 60 * 1000, // 07:15 WIB
};

export function shiftBounds(
  dayStart: Date,
  shift: RobotShift,
): { from: Date; to: Date } {
  return {
    from: new Date(dayStart.getTime() + SHIFT_START_OFFSET_MS[shift]),
    to: new Date(dayStart.getTime() + OVERTIME_CUTOFF_OFFSET_MS),
  };
}
