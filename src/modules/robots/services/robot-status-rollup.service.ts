import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { ROBOT_STATUS_DAILY_SUMMARY_REPOSITORY } from '../repositories/robot-status-daily-summary-repository.interface';
import type { IRobotStatusDailySummaryRepository } from '../repositories/robot-status-daily-summary-repository.interface';
import { RobotStatusAggregationService } from './robot-status-aggregation.service';
import { shiftBounds, startOfUtcDay } from '../utils/robot-status-day';
import { SHIFTS_REPOSITORY } from '../../shifts/repositories/shift-repository.interface';
import type { IShiftsRepository } from '../../shifts/repositories/shift-repository.interface';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RobotStatusRollupService {
  private readonly logger = new Logger(RobotStatusRollupService.name);

  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
    @Inject(ROBOT_STATUS_DAILY_SUMMARY_REPOSITORY)
    private readonly robotStatusDailySummaryRepository: IRobotStatusDailySummaryRepository,
    @Inject(SHIFTS_REPOSITORY)
    private readonly shiftsRepository: IShiftsRepository,
    private readonly aggregationService: RobotStatusAggregationService,
  ) {}

  // 00:00 UTC = 07:00 WIB — the earliest currently configured shift start,
  // which is also exactly when the LATEST shift's window closes (see
  // shiftBounds — a shift's window now runs until whichever other shift
  // starts next, so the last shift of the day always ends exactly when the
  // first one begins again). That means yesterday's shifts are always fully
  // complete right as this fires, not today's — an overnight shift (e.g.
  // 19:00-04:30) starting yesterday only finishes within *today's* UTC
  // calendar date. Weekly rotation only reassigns which Shift row owns
  // which hours, not the underlying set of start times, so this stays valid
  // across rotation. If shifts are ever reconfigured with a different
  // earliest start, this timing needs revisiting.
  @Cron('0 0 * * *')
  async rollUpYesterday(): Promise<void> {
    const todayStart = startOfUtcDay(new Date());
    const yesterdayStart = new Date(todayStart.getTime() - ONE_DAY_MS);
    await this.rollUpDay(yesterdayStart);
  }

  async rollUpDay(dayStart: Date): Promise<void> {
    const [{ items: robots }, { items: shifts }] = await Promise.all([
      this.robotsRepository.findAll({
        page: 1,
        limit: 1000,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
      this.shiftsRepository.findAll({
        page: 1,
        limit: 1000,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
    ]);
    const activeShifts = shifts.filter((shift) => shift.isActive);

    let rolledUp = 0;
    for (const shift of activeShifts) {
      const { from, to } = shiftBounds(dayStart, shift, activeShifts);
      for (const robot of robots) {
        const minutes = await this.aggregationService.computeMinutes(
          robot.id,
          from,
          to,
        );
        if (!minutes) continue;
        await this.robotStatusDailySummaryRepository.upsert(
          robot.id,
          dayStart,
          shift.id,
          minutes,
        );
        rolledUp += 1;
      }
    }

    this.logger.log(
      `Rolled up robot status minutes for ${dayStart.toISOString().slice(0, 10)}: ${rolledUp}/${robots.length * activeShifts.length} robot-shift combination(s) had data`,
    );
  }
}
