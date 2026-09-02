import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { ROBOT_STATUS_DAILY_SUMMARY_REPOSITORY } from '../repositories/robot-status-daily-summary-repository.interface';
import type {
  IRobotStatusDailySummaryRepository,
  RobotStatusDailyMinutes,
} from '../repositories/robot-status-daily-summary-repository.interface';
import { RobotStatusAggregationService } from '../services/robot-status-aggregation.service';
import { RobotStatusSummaryQueryDto } from '../dto/robot-status-summary-query.dto';
import { parseUtcDateOnly, startOfUtcDay } from '../utils/robot-status-day';

const ZERO_MINUTES: RobotStatusDailyMinutes = {
  runningMinutes: 0,
  idleMinutes: 0,
  chargingMinutes: 0,
};
const DAY_MS = 86_400_000;

export interface RobotStatusSummaryRow extends RobotStatusDailyMinutes {
  robotId: string;
  robotName: string;
}

@Injectable()
export class GetRobotStatusSummaryUseCase {
  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
    @Inject(ROBOT_STATUS_DAILY_SUMMARY_REPOSITORY)
    private readonly robotStatusDailySummaryRepository: IRobotStatusDailySummaryRepository,
    private readonly aggregationService: RobotStatusAggregationService,
  ) {}

  async execute(
    query: RobotStatusSummaryQueryDto,
  ): Promise<RobotStatusSummaryRow[]> {
    const dayStart = parseUtcDateOnly(query.date);
    if (Number.isNaN(dayStart.getTime())) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }

    const todayStart = startOfUtcDay(new Date());
    if (dayStart.getTime() > todayStart.getTime()) {
      throw new BadRequestException('date cannot be in the future');
    }

    const { items: robots } = await this.robotsRepository.findAll({
      page: 1,
      limit: 1000,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    // Today isn't over yet, so it's never in RobotStatusDailySummary —
    // compute it live, from midnight up to right now.
    if (dayStart.getTime() === todayStart.getTime()) {
      const now = new Date();
      return Promise.all(
        robots.map(async (robot) => ({
          robotId: robot.id,
          robotName: robot.name,
          ...((await this.aggregationService.computeMinutes(
            robot.id,
            dayStart,
            now,
          )) ?? ZERO_MINUTES),
        })),
      );
    }

    // A past, completed day — read the permanent rollup first. Anything
    // missing (the nightly cron hasn't reached this day yet, or this robot
    // didn't exist when it did) falls back to computing it live from raw
    // RobotActivityLog rows, which only works while they're still within
    // that table's retention window.
    const persisted =
      await this.robotStatusDailySummaryRepository.findAllByDate(dayStart);
    const persistedByRobotId = new Map(
      persisted.map((row) => [row.robotId, row]),
    );
    const dayEnd = new Date(dayStart.getTime() + DAY_MS);

    return Promise.all(
      robots.map(async (robot) => {
        const existing = persistedByRobotId.get(robot.id);
        if (existing) {
          return {
            robotId: robot.id,
            robotName: robot.name,
            runningMinutes: existing.runningMinutes,
            idleMinutes: existing.idleMinutes,
            chargingMinutes: existing.chargingMinutes,
          };
        }
        const minutes = await this.aggregationService.computeMinutes(
          robot.id,
          dayStart,
          dayEnd,
        );
        return {
          robotId: robot.id,
          robotName: robot.name,
          ...(minutes ?? ZERO_MINUTES),
        };
      }),
    );
  }
}
