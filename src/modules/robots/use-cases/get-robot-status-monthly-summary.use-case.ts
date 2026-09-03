import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';
import { ROBOT_STATUS_DAILY_SUMMARY_REPOSITORY } from '../repositories/robot-status-daily-summary-repository.interface';
import type { IRobotStatusDailySummaryRepository } from '../repositories/robot-status-daily-summary-repository.interface';
import { RobotStatusMonthlyQueryDto } from '../dto/robot-status-monthly-query.dto';
import { endOfUtcMonth, parseUtcMonthOnly } from '../utils/robot-status-day';
import { SHIFTS_REPOSITORY } from '../../shifts/repositories/shift-repository.interface';
import type { IShiftsRepository } from '../../shifts/repositories/shift-repository.interface';
import type { RobotStatusSummaryRow } from './get-robot-status-summary.use-case';

@Injectable()
export class GetRobotStatusMonthlySummaryUseCase {
  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
    @Inject(ROBOT_STATUS_DAILY_SUMMARY_REPOSITORY)
    private readonly robotStatusDailySummaryRepository: IRobotStatusDailySummaryRepository,
    @Inject(SHIFTS_REPOSITORY)
    private readonly shiftsRepository: IShiftsRepository,
  ) {}

  async execute(
    query: RobotStatusMonthlyQueryDto,
  ): Promise<RobotStatusSummaryRow[]> {
    const monthStart = parseUtcMonthOnly(query.month);
    if (Number.isNaN(monthStart.getTime())) {
      throw new BadRequestException('month must be in YYYY-MM format');
    }
    const monthEnd = endOfUtcMonth(monthStart);

    const shift = await this.shiftsRepository.findById(query.shiftId);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const { items: robots } = await this.robotsRepository.findAll({
      page: 1,
      limit: 1000,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    // Only the permanent rollup is used here — averaging/summing a whole
    // month over a live, not-yet-rolled-up "today" (or a day whose raw logs
    // have already aged out of RobotActivityLog's 7-day retention) would be
    // misleading, so days without a persisted row are simply excluded
    // rather than guessed at.
    return Promise.all(
      robots.map(async (robot) => {
        const days =
          await this.robotStatusDailySummaryRepository.findRangeByRobot(
            robot.id,
            shift.id,
            monthStart,
            monthEnd,
          );

        if (days.length === 0) {
          return {
            robotId: robot.id,
            robotName: robot.name,
            runningMinutes: 0,
            idleMinutes: 0,
            chargingMinutes: 0,
          };
        }

        const totals = days.reduce(
          (sum, day) => ({
            runningMinutes: sum.runningMinutes + day.runningMinutes,
            idleMinutes: sum.idleMinutes + day.idleMinutes,
            chargingMinutes: sum.chargingMinutes + day.chargingMinutes,
          }),
          { runningMinutes: 0, idleMinutes: 0, chargingMinutes: 0 },
        );

        const divisor = query.mode === 'AVERAGE' ? days.length : 1;
        return {
          robotId: robot.id,
          robotName: robot.name,
          runningMinutes: Math.round(totals.runningMinutes / divisor),
          idleMinutes: Math.round(totals.idleMinutes / divisor),
          chargingMinutes: Math.round(totals.chargingMinutes / divisor),
        };
      }),
    );
  }
}
