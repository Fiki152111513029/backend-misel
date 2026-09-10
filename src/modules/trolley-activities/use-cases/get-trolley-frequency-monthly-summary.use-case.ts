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
  TrolleySupplyFrequencyRow,
  bucketRowsByShiftDay,
  filterByAssignedShift,
  summarizeTrolleyFrequency,
} from '../utils/trolley-shift-summary.util';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class GetTrolleyFrequencyMonthlySummaryUseCase {
  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
    @Inject(SHIFTS_REPOSITORY)
    private readonly shiftsRepository: IShiftsRepository,
  ) {}

  async execute(
    query: TrolleyShiftMonthlyQueryDto,
  ): Promise<TrolleySupplyFrequencyRow[]> {
    const monthStart = parseUtcMonthOnly(query.month);
    if (Number.isNaN(monthStart.getTime())) {
      throw new BadRequestException('month must be in YYYY-MM format');
    }
    const monthEnd = endOfUtcMonth(monthStart);

    const shift = await this.shiftsRepository.findById(query.shiftId);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const allRows = await this.trolleyActivitiesRepository.getShiftActivities(
      new Date(monthStart.getTime() - ONE_DAY_MS),
      new Date(monthEnd.getTime() + ONE_DAY_MS),
    );
    const rows = filterByAssignedShift(allRows, query.shiftId);
    const buckets = bucketRowsByShiftDay(rows, monthStart, monthEnd, shift);

    const perTrolley = new Map<
      string,
      {
        trolleyCode: string;
        trolleyName: string;
        totalCount: number;
        daysWithData: number;
      }
    >();
    for (const dayRows of buckets.values()) {
      for (const day of summarizeTrolleyFrequency(dayRows)) {
        const entry = perTrolley.get(day.trolleyId) ?? {
          trolleyCode: day.trolleyCode,
          trolleyName: day.trolleyName,
          totalCount: 0,
          daysWithData: 0,
        };
        entry.totalCount += day.count;
        entry.daysWithData += 1;
        perTrolley.set(day.trolleyId, entry);
      }
    }

    return [...perTrolley.entries()]
      .map(([trolleyId, value]) => {
        const divisor = query.mode === 'AVERAGE' ? value.daysWithData : 1;
        return {
          trolleyId,
          trolleyCode: value.trolleyCode,
          trolleyName: value.trolleyName,
          count: Math.round(value.totalCount / divisor),
        };
      })
      .sort((a, b) => b.count - a.count);
  }
}
