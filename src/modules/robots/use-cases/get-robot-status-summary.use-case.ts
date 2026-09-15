import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { ROBOT_STATUS_DAILY_SUMMARY_REPOSITORY } from '../repositories/robot-status-daily-summary-repository.interface';
import type {
  IRobotStatusDailySummaryRepository,
  RobotStatusMinutesWithAlarm,
} from '../repositories/robot-status-daily-summary-repository.interface';
import { RobotStatusAggregationService } from '../services/robot-status-aggregation.service';
import { RobotAlarmAggregationService } from '../../robot-alarms/services/robot-alarm-aggregation.service';
import { RobotStatusSummaryQueryDto } from '../dto/robot-status-summary-query.dto';
import {
  parseUtcDateOnly,
  shiftBounds,
  startOfUtcDay,
} from '../utils/robot-status-day';
import { SHIFTS_REPOSITORY } from '../../shifts/repositories/shift-repository.interface';
import type { IShiftsRepository } from '../../shifts/repositories/shift-repository.interface';
import { fetchActiveShifts } from '../../shifts/utils/active-shifts.util';

const ZERO_MINUTES: RobotStatusMinutesWithAlarm = {
  runningMinutes: 0,
  idleMinutes: 0,
  chargingMinutes: 0,
  alarmMinutes: 0,
};

export interface RobotStatusSummaryRow extends RobotStatusMinutesWithAlarm {
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
    @Inject(SHIFTS_REPOSITORY)
    private readonly shiftsRepository: IShiftsRepository,
    private readonly aggregationService: RobotStatusAggregationService,
    private readonly alarmAggregationService: RobotAlarmAggregationService,
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

    const shift = await this.shiftsRepository.findById(query.shiftId);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const [{ items: robots }, activeShifts] = await Promise.all([
      this.robotsRepository.findAll({
        page: 1,
        limit: 1000,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
      fetchActiveShifts(this.shiftsRepository),
    ]);

    const { from: shiftStart, to: shiftEnd } = shiftBounds(
      dayStart,
      shift,
      activeShifts,
    );

    // Today isn't over yet, so it's never in RobotStatusDailySummary —
    // compute it live. Clamped to the tracked shift window (which now
    // extends until whichever other active shift starts next, not a fixed
    // cutoff): nothing before the shift starts or after that boundary
    // counts, so "now" never pushes the window past shiftEnd, and a query
    // made before the shift has even started for the day naturally yields
    // an empty (zero-duration) range.
    if (dayStart.getTime() === todayStart.getTime()) {
      const now = new Date();
      const liveEnd =
        now < shiftStart ? shiftStart : now > shiftEnd ? shiftEnd : now;
      return Promise.all(
        robots.map(async (robot) => {
          const alarmIntervals =
            await this.alarmAggregationService.computeAlarmIntervals(
              robot.amrDeviceSerialNo,
              shiftStart,
              liveEnd,
            );
          const minutes = await this.aggregationService.computeMinutes(
            robot.id,
            shiftStart,
            liveEnd,
            alarmIntervals,
          );
          const alarmMinutes =
            this.alarmAggregationService.totalMinutes(alarmIntervals);
          return {
            robotId: robot.id,
            robotName: robot.name,
            ...(minutes ?? ZERO_MINUTES),
            alarmMinutes,
          };
        }),
      );
    }

    // A past, completed day — read the permanent rollup first. Anything
    // missing (the nightly cron hasn't reached this day yet, or this robot
    // didn't exist when it did) falls back to computing it live from raw
    // RobotActivityLog rows, which only works while they're still within
    // that table's retention window.
    const persisted =
      await this.robotStatusDailySummaryRepository.findAllByDate(
        dayStart,
        query.shiftId,
      );
    const persistedByRobotId = new Map(
      persisted.map((row) => [row.robotId, row]),
    );

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
            alarmMinutes: existing.alarmMinutes,
          };
        }
        const alarmIntervals =
          await this.alarmAggregationService.computeAlarmIntervals(
            robot.amrDeviceSerialNo,
            shiftStart,
            shiftEnd,
          );
        const minutes = await this.aggregationService.computeMinutes(
          robot.id,
          shiftStart,
          shiftEnd,
          alarmIntervals,
        );
        const alarmMinutes =
          this.alarmAggregationService.totalMinutes(alarmIntervals);
        return {
          robotId: robot.id,
          robotName: robot.name,
          ...(minutes ?? ZERO_MINUTES),
          alarmMinutes,
        };
      }),
    );
  }
}
