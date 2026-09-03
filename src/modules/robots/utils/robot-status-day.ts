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

// A shift's window is tracked from its own configured startTime (WIB,
// Asia/Jakarta, UTC+7 — from the Shift table, e.g. "07:00") through a
// fixed 21:00 WIB overtime cutoff, regardless of the shift's own endTime
// (e.g. Sesi 1's 16:15) — shifts sometimes run into overtime, and this
// window has to cover that rather than cutting off at the normal finish
// time. WIB is UTC+7, so 07:00 WIB lines up with 00:00 UTC of the same
// calendar date — i.e. exactly startOfUtcDay(date) — every other WIB clock
// time is expressed as an offset from that same UTC midnight (negative
// offsets, for a shift starting before 07:00 WIB, correctly reach back
// into the previous UTC calendar date — Date arithmetic doesn't care about
// calendar boundaries, only absolute milliseconds).
const OVERTIME_CUTOFF_OFFSET_MS = 14 * 60 * 60 * 1000; // 21:00 WIB
const WIB_UTC_OFFSET_MINUTES = 7 * 60;

function parseHHMMToMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return NaN;
  const [, hours, minutes] = match;
  return Number(hours) * 60 + Number(minutes);
}

export function shiftBounds(
  dayStart: Date,
  shift: { startTime: string },
): { from: Date; to: Date } {
  const startMinutesWib = parseHHMMToMinutes(shift.startTime);
  const startOffsetMs = (startMinutesWib - WIB_UTC_OFFSET_MINUTES) * 60_000;
  return {
    from: new Date(dayStart.getTime() + startOffsetMs),
    to: new Date(dayStart.getTime() + OVERTIME_CUTOFF_OFFSET_MS),
  };
}
