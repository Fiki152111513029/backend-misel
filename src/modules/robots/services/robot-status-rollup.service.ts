import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { ROBOT_STATUS_DAILY_SUMMARY_REPOSITORY } from '../repositories/robot-status-daily-summary-repository.interface';
import type { IRobotStatusDailySummaryRepository } from '../repositories/robot-status-daily-summary-repository.interface';
import { RobotStatusAggregationService } from './robot-status-aggregation.service';
import { shiftBounds, startOfUtcDay } from '../utils/robot-status-day';

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

  // 10:00 UTC = 17:00 WIB — half an hour after the tracked shift (07:00-
  // 16:30 WIB) ends, so today's shift is always already complete by the
  // time this runs. The whole shift falls inside one UTC calendar date
  // (00:00-09:30 UTC), so "today" is the right day to roll up here, not
  // yesterday.
  @Cron('0 10 * * *')
  async rollUpToday(): Promise<void> {
    const todayStart = startOfUtcDay(new Date());
    await this.rollUpDay(todayStart);
  }

  async rollUpDay(dayStart: Date): Promise<void> {
    const { from, to } = shiftBounds(dayStart);
    const { items: robots } = await this.robotsRepository.findAll({
      page: 1,
      limit: 1000,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    let rolledUp = 0;
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
        minutes,
      );
      rolledUp += 1;
    }

    this.logger.log(
      `Rolled up robot status minutes for ${dayStart.toISOString().slice(0, 10)}: ${rolledUp}/${robots.length} robot(s) had data`,
    );
  }
}
