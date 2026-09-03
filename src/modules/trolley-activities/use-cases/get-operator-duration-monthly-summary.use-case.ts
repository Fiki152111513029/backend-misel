import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';
import { SHIFTS_REPOSITORY } from '../../shifts/repositories/shift-repository.interface';
import type { IShiftsRepository } from '../../shifts/repositories/shift-repository.interface';
import { TrolleyShiftMonthlyQueryDto } from '../dto/trolley-shift-monthly-query.dto';
import {
  endOfUtcMonth,
  parseUtcMonthOnly,
} from '../../robots/utils/robot-status-day';
import {
  OperatorDurationRow,
  bucketRowsByShiftDay,
  summarizeOperatorDuration,
} from '../utils/trolley-shift-summary.util';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class GetOperatorDurationMonthlySummaryUseCase {
  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
    @Inject(SHIFTS_REPOSITORY)
    private readonly shiftsRepository: IShiftsRepository,
  ) {}

  async execute(
    query: TrolleyShiftMonthlyQueryDto,
  ): Promise<OperatorDurationRow[]> {
    const monthStart = parseUtcMonthOnly(query.month);
    if (Number.isNaN(monthStart.getTime())) {
      throw new BadRequestException('month must be in YYYY-MM format');
    }
    const monthEnd = endOfUtcMonth(monthStart);

    const shift = await this.shiftsRepository.findById(query.shiftId);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    // A shift's start offset can reach into the previous UTC day (see
    // shiftBounds), so pad the fetch a day on each side of the month —
    // bucketRowsByShiftDay only assigns rows into the [monthStart,
    // monthEnd) days' own windows anyway, so the padding can't leak a row
    // into the wrong month.
    const rows = await this.trolleyActivitiesRepository.getShiftActivities(
      new Date(monthStart.getTime() - ONE_DAY_MS),
      new Date(monthEnd.getTime() + ONE_DAY_MS),
    );
    const buckets = bucketRowsByShiftDay(rows, monthStart, monthEnd, shift);

    const perUser = new Map<
      string,
      {
        fullName: string;
        totalMinutes: number;
        completedCount: number;
        daysWithData: number;
      }
    >();
    for (const dayRows of buckets.values()) {
      for (const day of summarizeOperatorDuration(dayRows)) {
        const entry = perUser.get(day.userId) ?? {
          fullName: day.fullName,
          totalMinutes: 0,
          completedCount: 0,
          daysWithData: 0,
        };
        entry.totalMinutes += day.totalDurationMinutes;
        entry.completedCount += day.completedCount;
        entry.daysWithData += 1;
        perUser.set(day.userId, entry);
      }
    }

    return [...perUser.entries()]
      .map(([userId, value]) => {
        const divisor = query.mode === 'AVERAGE' ? value.daysWithData : 1;
        return {
          userId,
          fullName: value.fullName,
          totalDurationMinutes: Math.round(value.totalMinutes / divisor),
          avgDurationMinutes: value.completedCount
            ? Math.round(value.totalMinutes / value.completedCount)
            : 0,
          completedCount: value.completedCount,
        };
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }
}
