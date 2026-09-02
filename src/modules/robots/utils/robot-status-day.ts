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
