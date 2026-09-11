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
import { TrolleyShiftSummaryQueryDto } from '../dto/trolley-shift-summary-query.dto';
import {
  parseUtcDateOnly,
  shiftBounds,
} from '../../robots/utils/robot-status-day';
import {
  TrolleySupplyFrequencyRow,
  fetchActiveWarehouseLocationCodes,
  filterByAssignedShift,
  splitRowsByDirection,
  summarizeTrolleyFrequency,
} from '../utils/trolley-shift-summary.util';

@Injectable()
export class GetTrolleyFrequencySummaryUseCase {
  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
    @Inject(SHIFTS_REPOSITORY)
    private readonly shiftsRepository: IShiftsRepository,
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
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
    const [allRows, warehouseCodes] = await Promise.all([
      this.trolleyActivitiesRepository.getShiftActivities(from, to),
      fetchActiveWarehouseLocationCodes(this.warehouseLocationsRepository),
    ]);
    const shiftRows = filterByAssignedShift(allRows, query.shiftId);
    // "Supply" is specifically Warehouse Location -> Production Location —
    // pickup scanned from a Warehouse Location — same WAREHOUSE direction
    // used by the Yamazumi Dealer Operator chart, not the Production->
    // Warehouse (Supply Operator) direction despite the similar naming.
    const rows = splitRowsByDirection(shiftRows, warehouseCodes).WAREHOUSE;
    return summarizeTrolleyFrequency(rows);
  }
}
