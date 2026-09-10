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
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import { OperatorDurationQueryDto } from '../dto/operator-duration-query.dto';
import {
  parseUtcDateOnly,
  shiftBounds,
} from '../../robots/utils/robot-status-day';
import {
  OperatorDurationRow,
  fetchActiveWarehouseLocationCodes,
  filterByAssignedShift,
  splitRowsByDirection,
  summarizeOperatorDuration,
} from '../utils/trolley-shift-summary.util';

@Injectable()
export class GetOperatorDurationSummaryUseCase {
  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
    @Inject(SHIFTS_REPOSITORY)
    private readonly shiftsRepository: IShiftsRepository,
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
  ) {}

  async execute(
    query: OperatorDurationQueryDto,
  ): Promise<OperatorDurationRow[]> {
    const dayStart = parseUtcDateOnly(query.date);
    if (Number.isNaN(dayStart.getTime())) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }

    const shift = await this.shiftsRepository.findById(query.shiftId);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const { from, to } = shiftBounds(dayStart, shift);
    const [allRows, warehouseCodes] = await Promise.all([
      this.trolleyActivitiesRepository.getShiftActivities(from, to),
      fetchActiveWarehouseLocationCodes(this.warehouseLocationsRepository),
    ]);
    const rows = filterByAssignedShift(allRows, query.shiftId);
    const byDirection = splitRowsByDirection(rows, warehouseCodes);
    return summarizeOperatorDuration(byDirection[query.direction]);
  }
}
