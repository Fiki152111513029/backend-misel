import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RobotShift } from '@prisma/client';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { ROBOT_STATUS_DAILY_SUMMARY_REPOSITORY } from '../repositories/robot-status-daily-summary-repository.interface';
import type { IRobotStatusDailySummaryRepository } from '../repositories/robot-status-daily-summary-repository.interface';
import { RobotStatusAggregationService } from './robot-status-aggregation.service';
import { shiftBounds, startOfUtcDay } from '../utils/robot-status-day';

const SHIFTS: RobotShift[] = [RobotShift.SESI_1, RobotShift.SESI_2];

@Injectable()
export class RobotStatusRollupService {
  private readonly logger = new Logger(RobotStatusRollupService.name);

  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
    @Inject(ROBOT_STATUS_DAILY_SUMMARY_REPOSITORY)
    private readonly robotStatusDailySummaryRepository: IRobotStatusDailySummaryRepository,
    private readonly aggregationService: RobotStatusAggregationService,
  ) {}

  // 14:10 UTC = 21:10 WIB — ten minutes after the overtime cutoff both
  // shifts are tracked up to (21:00 WIB), so today's shifts are always
  // already complete by the time this runs. That whole window falls inside
  // one UTC calendar date (00:00-14:00 UTC), so "today" is the right day to
  // roll up here, not yesterday.
  @Cron('10 14 * * *')
  async rollUpToday(): Promise<void> {
    const todayStart = startOfUtcDay(new Date());
    await this.rollUpDay(todayStart);
  }

  async rollUpDay(dayStart: Date): Promise<void> {
    const { items: robots } = await this.robotsRepository.findAll({
      page: 1,
      limit: 1000,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    let rolledUp = 0;
    for (const shift of SHIFTS) {
      const { from, to } = shiftBounds(dayStart, shift);
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
          shift,
          minutes,
        );
        rolledUp += 1;
      }
    }

    this.logger.log(
      `Rolled up robot status minutes for ${dayStart.toISOString().slice(0, 10)}: ${rolledUp}/${robots.length * SHIFTS.length} robot-shift combination(s) had data`,
    );
  }
}
