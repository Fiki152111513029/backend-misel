import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { ROBOT_STATUS_DAILY_SUMMARY_REPOSITORY } from '../repositories/robot-status-daily-summary-repository.interface';
import type { IRobotStatusDailySummaryRepository } from '../repositories/robot-status-daily-summary-repository.interface';
import { RobotStatusAggregationService } from './robot-status-aggregation.service';
import { startOfUtcDay } from '../utils/robot-status-day';

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

  // 00:10 UTC — a few minutes after the day rolls over, so the last poll of
  // the previous day (RobotStatusPollerService runs every 15s) has already
  // landed before this reads it.
  @Cron('10 0 * * *')
  async rollUpYesterday(): Promise<void> {
    const todayStart = startOfUtcDay(new Date());
    const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
    await this.rollUpDay(yesterdayStart);
  }

  async rollUpDay(dayStart: Date): Promise<void> {
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
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
        dayStart,
        dayEnd,
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
