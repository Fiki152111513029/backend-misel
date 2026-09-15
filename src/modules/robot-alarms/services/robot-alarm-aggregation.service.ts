import { Inject, Injectable } from '@nestjs/common';
import { ROBOT_ALARMS_REPOSITORY } from '../repositories/robot-alarm-repository.interface';
import type { IRobotAlarmsRepository } from '../repositories/robot-alarm-repository.interface';

const MS_PER_MINUTE = 60_000;

// A closed time range in epoch milliseconds — [start, end).
export interface AlarmInterval {
  start: number;
  end: number;
}

@Injectable()
export class RobotAlarmAggregationService {
  constructor(
    @Inject(ROBOT_ALARMS_REPOSITORY)
    private readonly robotAlarmsRepository: IRobotAlarmsRepository,
  ) {}

  /**
   * Merged, non-overlapping alarm-downtime intervals for one device within
   * [from, to) — walks every alarm event for the device up to `to` (not
   * just within the window, so an alarm that started before `from` and is
   * still ongoing is still counted from `from`) and pairs each active
   * (alarmStatus=0) event with the next resolved (alarmStatus=1) event
   * sharing the same alarmCode (falling back to alarmType when alarmCode is
   * missing). An alarm still open at `to` counts up to `to`. Overlapping
   * intervals (e.g. two different alarm codes active at once) are merged so
   * downstream consumers — RobotStatusAggregationService excluding this time
   * from Running/Idle/Charging, and totalMinutes() below — never double
   * count a moment covered by more than one alarm.
   */
  async computeAlarmIntervals(
    deviceName: string,
    from: Date,
    to: Date,
  ): Promise<AlarmInterval[]> {
    const events = await this.robotAlarmsRepository.findAllForDeviceNameUpTo(
      deviceName,
      to,
    );

    const openSince = new Map<string, Date>();
    const rawIntervals: AlarmInterval[] = [];

    for (const event of events) {
      const key = event.alarmCode ?? `type:${event.alarmType}`;
      if (event.alarmStatus === 0) {
        // A fresh active event for an already-open key just resets the
        // start — shouldn't normally happen, but keeps this defensive
        // against RCS re-sending an active event without a resolve first.
        openSince.set(key, event.receivedAt);
      } else if (event.alarmStatus === 1) {
        const start = openSince.get(key);
        if (start) {
          rawIntervals.push({
            start: start.getTime(),
            end: event.receivedAt.getTime(),
          });
          openSince.delete(key);
        }
      }
    }

    // Anything still open at `to` counts up to `to`.
    for (const start of openSince.values()) {
      rawIntervals.push({ start: start.getTime(), end: to.getTime() });
    }

    return this.clipAndMerge(rawIntervals, from.getTime(), to.getTime());
  }

  /** Total minutes covered by a set of (already merged) alarm intervals. */
  totalMinutes(intervals: AlarmInterval[]): number {
    const totalMs = intervals.reduce(
      (sum, interval) => sum + (interval.end - interval.start),
      0,
    );
    return Math.round(totalMs / MS_PER_MINUTE);
  }

  /** Convenience wrapper for callers that only need the total, not the intervals. */
  async computeAlarmMinutes(
    deviceName: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    return this.totalMinutes(
      await this.computeAlarmIntervals(deviceName, from, to),
    );
  }

  private clipAndMerge(
    intervals: AlarmInterval[],
    from: number,
    to: number,
  ): AlarmInterval[] {
    const clipped = intervals
      .map((interval) => ({
        start: Math.max(interval.start, from),
        end: Math.min(interval.end, to),
      }))
      .filter((interval) => interval.end > interval.start)
      .sort((a, b) => a.start - b.start);

    const merged: AlarmInterval[] = [];
    for (const interval of clipped) {
      const last = merged[merged.length - 1];
      if (last && interval.start <= last.end) {
        last.end = Math.max(last.end, interval.end);
      } else {
        merged.push({ ...interval });
      }
    }
    return merged;
  }
}
