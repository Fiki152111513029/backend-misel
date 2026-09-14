import type { Shift } from '@prisma/client';

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
// Asia/Jakarta, UTC+7 — from the Shift table, e.g. "07:00") through
// whichever OTHER active shift starts next, chronologically — not a fixed
// wall-clock cutoff. That way any activity past a shift's normal endTime
// but before the next shift begins still counts as that shift's own
// overtime, every active shift's window adds up to a full 24 hours with no
// gaps, and it stays correct however shifts are configured (including the
// weekly rotation below) instead of assuming a specific schedule. WIB is
// UTC+7, so 07:00 WIB lines up with 00:00 UTC of the same calendar date —
// i.e. exactly startOfUtcDay(date) — every other WIB clock time is
// expressed as an offset from that same UTC midnight (negative offsets, for
// a shift starting before 07:00 WIB, correctly reach back into the
// previous UTC calendar date — Date arithmetic doesn't care about calendar
// boundaries, only absolute milliseconds).
const WIB_UTC_OFFSET_MINUTES = 7 * 60;

function parseHHMMToMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return NaN;
  const [, hours, minutes] = match;
  return Number(hours) * 60 + Number(minutes);
}

export type ShiftTimeInfo = Pick<
  Shift,
  'id' | 'name' | 'startTime' | 'endTime'
>;

// ISO-8601 week number (1-53) of `date`'s UTC calendar date. Used only as a
// deterministic "which week is it" signal for the automatic shift rotation
// below — the exact numbering standard doesn't matter, only that it's
// stateless (recomputed fresh every call, nothing stored anywhere) and
// flips parity every single calendar week without drifting, so rotation
// can never get stuck out of sync even after the server being down a while.
function getIsoWeekNumber(date: Date): number {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNr = (target.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  target.setUTCDate(target.getUTCDate() - dayNr + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3);
  return (
    1 +
    Math.round(
      (target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000),
    )
  );
}

// Every other ISO week, every active Shift automatically swaps hours with
// the next one, sorted by name and wrapping around (with exactly two
// active shifts — e.g. Shift A / Shift B — this is a straight swap between
// them). Nothing is written to the database and there's no cron job for
// this part — it's recomputed fresh from the calendar week on every call,
// so it can never drift or need manual correction.
export function isRotatedShiftWeek(date: Date): boolean {
  return getIsoWeekNumber(date) % 2 === 0;
}

// The hours this Shift actually runs on `date`, after applying the weekly
// rotation above — every function below uses this instead of the Shift
// row's own stored startTime/endTime directly. `allActiveShifts` must
// include `shift` itself (by id) for rotation to apply to it; a shift not
// present there (e.g. a since-deactivated one) just keeps its own stored
// hours, unrotated.
export function effectiveShiftTimes(
  shift: ShiftTimeInfo,
  allActiveShifts: ShiftTimeInfo[],
  date: Date,
): { startTime: string; endTime: string } {
  if (allActiveShifts.length < 2 || !isRotatedShiftWeek(date)) {
    return { startTime: shift.startTime, endTime: shift.endTime };
  }
  const sorted = [...allActiveShifts].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const index = sorted.findIndex((s) => s.id === shift.id);
  if (index === -1) {
    return { startTime: shift.startTime, endTime: shift.endTime };
  }
  const next = sorted[(index + 1) % sorted.length];
  return { startTime: next.startTime, endTime: next.endTime };
}

export function shiftBounds(
  dayStart: Date,
  shift: ShiftTimeInfo,
  allActiveShifts: ShiftTimeInfo[],
): { from: Date; to: Date } {
  const effective = effectiveShiftTimes(shift, allActiveShifts, dayStart);
  const startMinutesWib = parseHHMMToMinutes(effective.startTime);
  const startOffsetMs = (startMinutesWib - WIB_UTC_OFFSET_MINUTES) * 60_000;

  // Falls back to a straight 24-hour window (start -> same time next day)
  // when this is the only active shift, or none of the others' effective
  // start times land later in the day than this one.
  const allStartMinutes = [
    ...new Set(
      allActiveShifts.map((s) =>
        parseHHMMToMinutes(
          effectiveShiftTimes(s, allActiveShifts, dayStart).startTime,
        ),
      ),
    ),
  ].sort((a, b) => a - b);
  const nextStartMinutes = allStartMinutes.find(
    (minutes) => minutes > startMinutesWib,
  );
  const endMinutesWib =
    nextStartMinutes ?? (allStartMinutes[0] ?? startMinutesWib) + 24 * 60;
  const endOffsetMs = (endMinutesWib - WIB_UTC_OFFSET_MINUTES) * 60_000;

  return {
    from: new Date(dayStart.getTime() + startOffsetMs),
    to: new Date(dayStart.getTime() + endOffsetMs),
  };
}
