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
import { TrolleyShiftSummaryQueryDto } from '../dto/trolley-shift-summary-query.dto';
import {
  parseUtcDateOnly,
  shiftBounds,
} from '../../robots/utils/robot-status-day';
import {
  TrolleySupplyFrequencyRow,
  filterByAssignedShift,
  summarizeTrolleyFrequency,
} from '../utils/trolley-shift-summary.util';

@Injectable()
export class GetTrolleyFrequencySummaryUseCase {
  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
    @Inject(SHIFTS_REPOSITORY)
    private readonly shiftsRepository: IShiftsRepository,
  ) {}

  async execute(
    query: TrolleyShiftSummaryQueryDto,
  ): Promise<TrolleySupplyFrequencyRow[]> {
    const dayStart = parseUtcDateOnly(query.date);
    if (Number.isNaN(dayStart.getTime())) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }

    const shift = await this.shiftsRepository.findById(query.shiftId);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const { from, to } = shiftBounds(dayStart, shift);
    const allRows = await this.trolleyActivitiesRepository.getShiftActivities(
      from,
      to,
    );
    const rows = filterByAssignedShift(allRows, query.shiftId);
    return summarizeTrolleyFrequency(rows);
  }
}
