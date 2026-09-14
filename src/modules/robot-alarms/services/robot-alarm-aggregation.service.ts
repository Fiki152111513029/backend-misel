import { Inject, Injectable } from '@nestjs/common';
import { ROBOT_ALARMS_REPOSITORY } from '../repositories/robot-alarm-repository.interface';
import type { IRobotAlarmsRepository } from '../repositories/robot-alarm-repository.interface';

const MS_PER_MINUTE = 60_000;

@Injectable()
export class RobotAlarmAggregationService {
  constructor(
    @Inject(ROBOT_ALARMS_REPOSITORY)
    private readonly robotAlarmsRepository: IRobotAlarmsRepository,
  ) {}

  /**
   * Total alarm-downtime minutes for one device within [from, to) — walks
   * every alarm event for the device up to `to` (not just within the
   * window, so an alarm that started before `from` and is still ongoing is
   * still counted from `from`) and pairs each active (alarmStatus=0) event
   * with the next resolved (alarmStatus=1) event sharing the same alarmCode
   * (falling back to alarmType when alarmCode is missing). An alarm still
   * open at `to` counts up to `to`. Independent of Running/Idle/Charging —
   * a robot can be simultaneously "Idle" and in an active alarm.
   */
  async computeAlarmMinutes(
    deviceName: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    const events = await this.robotAlarmsRepository.findAllForDeviceNameUpTo(
      deviceName,
      to,
    );

    const openSince = new Map<string, Date>();
    let totalMs = 0;

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
          totalMs += this.overlapMs(start, event.receivedAt, from, to);
          openSince.delete(key);
        }
      }
    }

    // Anything still open at `to` counts up to `to`.
    for (const start of openSince.values()) {
      totalMs += this.overlapMs(start, to, from, to);
    }

    return Math.round(totalMs / MS_PER_MINUTE);
  }

  private overlapMs(start: Date, end: Date, from: Date, to: Date): number {
    const overlapStart = Math.max(start.getTime(), from.getTime());
    const overlapEnd = Math.min(end.getTime(), to.getTime());
    return Math.max(0, overlapEnd - overlapStart);
  }
}
