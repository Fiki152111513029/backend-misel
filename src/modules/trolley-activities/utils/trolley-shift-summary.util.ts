import { TaskStatus } from '@prisma/client';
import type { Shift } from '@prisma/client';
import type { ShiftActivityRow } from '../repositories/trolley-activity-repository.interface';
import { shiftBounds } from '../../robots/utils/robot-status-day';

// Only these two roles' time is meaningful for the Operator Duration chart
// — Exim/Super Admin don't run Trolley Task pickups/drops as their job.
const OPERATOR_DURATION_ROLES = new Set(['Warehouse', 'Operator']);

export interface OperatorDurationRow {
  userId: string;
  fullName: string;
  totalDurationMinutes: number;
  avgDurationMinutes: number;
  completedCount: number;
}

export interface TrolleySupplyFrequencyRow {
  trolleyId: string;
  trolleyCode: string;
  trolleyName: string;
  count: number;
}

// Splits [monthStart, monthEnd) into each UTC calendar day's own shift
// window (see shiftBounds) and buckets the already-fetched rows into
// whichever day's window their startDate falls in. A row can only belong
// to one day's bucket since shift windows for consecutive days never
// overlap (they run from one day's configured start through the fixed
// 21:00 WIB cutoff, well short of the next day's start).
export function bucketRowsByShiftDay(
  rows: ShiftActivityRow[],
  monthStart: Date,
  monthEnd: Date,
  shift: Pick<Shift, 'startTime'>,
): Map<string, ShiftActivityRow[]> {
  const buckets = new Map<string, ShiftActivityRow[]>();
  for (
    let day = new Date(monthStart);
    day.getTime() < monthEnd.getTime();
    day = new Date(day.getTime() + 24 * 60 * 60 * 1000)
  ) {
    const { from, to } = shiftBounds(day, shift);
    const dayKey = day.toISOString().slice(0, 10);
    const dayRows = rows.filter(
      (row) => row.startDate >= from && row.startDate < to,
    );
    if (dayRows.length > 0) buckets.set(dayKey, dayRows);
  }
  return buckets;
}

export function summarizeOperatorDuration(
  rows: ShiftActivityRow[],
  divisorByUserId?: (userId: string) => number,
): OperatorDurationRow[] {
  const map = new Map<
    string,
    { fullName: string; totalSeconds: number; completedCount: number }
  >();
  for (const row of rows) {
    if (row.status !== TaskStatus.COMPLETED || !row.endDate) continue;
    if (!OPERATOR_DURATION_ROLES.has(row.roleName)) continue;
    const seconds = (row.endDate.getTime() - row.startDate.getTime()) / 1000;
    const entry = map.get(row.userId) ?? {
      fullName: row.userFullName,
      totalSeconds: 0,
      completedCount: 0,
    };
    entry.totalSeconds += seconds;
    entry.completedCount += 1;
    map.set(row.userId, entry);
  }
  return [...map.entries()]
    .map(([userId, value]) => {
      const divisor = divisorByUserId?.(userId) ?? 1;
      return {
        userId,
        fullName: value.fullName,
        totalDurationMinutes: Math.round(value.totalSeconds / 60 / divisor),
        avgDurationMinutes: value.completedCount
          ? Math.round(value.totalSeconds / value.completedCount / 60)
          : 0,
        completedCount: value.completedCount,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export function summarizeTrolleyFrequency(
  rows: ShiftActivityRow[],
  divisorByTrolleyId?: (trolleyId: string) => number,
): TrolleySupplyFrequencyRow[] {
  const map = new Map<
    string,
    { trolleyCode: string; trolleyName: string; count: number }
  >();
  for (const row of rows) {
    const entry = map.get(row.trolleyId) ?? {
      trolleyCode: row.trolleyCode,
      trolleyName: row.trolleyName,
      count: 0,
    };
    entry.count += 1;
    map.set(row.trolleyId, entry);
  }
  return [...map.entries()]
    .map(([trolleyId, value]) => {
      const divisor = divisorByTrolleyId?.(trolleyId) ?? 1;
      return {
        trolleyId,
        trolleyCode: value.trolleyCode,
        trolleyName: value.trolleyName,
        count: Math.round(value.count / divisor),
      };
    })
    .sort((a, b) => b.count - a.count);
}
