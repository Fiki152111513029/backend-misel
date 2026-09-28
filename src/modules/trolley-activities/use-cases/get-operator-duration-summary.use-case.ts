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
import { fetchActiveShifts } from '../../shifts/utils/active-shifts.util';
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

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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

    // No shiftId means "All Shifts": the whole UTC day, with no
    // assigned-shift filter on the rows below. It is the only option when
    // no Shift has been configured, so the chart still has something to
    // show instead of sitting empty.
    const shift = query.shiftId
      ? await this.shiftsRepository.findById(query.shiftId)
      : null;
    if (query.shiftId && !shift) {
      throw new NotFoundException('Shift not found');
    }

    const activeShifts = await fetchActiveShifts(this.shiftsRepository);
    const { from, to } = shift
      ? shiftBounds(dayStart, shift, activeShifts)
      : { from: dayStart, to: new Date(dayStart.getTime() + ONE_DAY_MS) };
    const [allRows, warehouseCodes] = await Promise.all([
      this.trolleyActivitiesRepository.getShiftActivities(from, to),
      fetchActiveWarehouseLocationCodes(this.warehouseLocationsRepository),
    ]);
    const rows = filterByAssignedShift(allRows, query.shiftId);
    const byDirection = splitRowsByDirection(rows, warehouseCodes);
    return summarizeOperatorDuration(byDirection[query.direction]);
  }
}
