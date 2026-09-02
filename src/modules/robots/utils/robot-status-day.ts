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

// Only the 07:00-16:30 WIB (Asia/Jakarta, UTC+7) work shift counts toward
// Running/Idle/Charging minutes — anything outside it (before the shift
// starts, after it ends) is simply not tracked. WIB is UTC+7, so 07:00 WIB
// lines up with 00:00 UTC of the same calendar date — i.e. exactly
// startOfUtcDay(date) — and 16:30 WIB is 9.5 hours after that.
const SHIFT_START_OFFSET_MS = 0;
const SHIFT_END_OFFSET_MS = 9.5 * 60 * 60 * 1000;

export function shiftBounds(dayStart: Date): { from: Date; to: Date } {
  return {
    from: new Date(dayStart.getTime() + SHIFT_START_OFFSET_MS),
    to: new Date(dayStart.getTime() + SHIFT_END_OFFSET_MS),
  };
}
