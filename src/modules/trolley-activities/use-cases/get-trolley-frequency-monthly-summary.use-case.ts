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
import { TrolleyShiftMonthlyQueryDto } from '../dto/trolley-shift-monthly-query.dto';
import {
  endOfUtcMonth,
  parseUtcMonthOnly,
} from '../../robots/utils/robot-status-day';
import {
  TrolleySupplyFrequencyRow,
  bucketRowsByShiftDay,
  fetchActiveWarehouseLocationCodes,
  filterByAssignedShift,
  splitRowsByDirection,
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
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
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

    const [allRows, warehouseCodes] = await Promise.all([
      this.trolleyActivitiesRepository.getShiftActivities(
        new Date(monthStart.getTime() - ONE_DAY_MS),
        new Date(monthEnd.getTime() + ONE_DAY_MS),
      ),
      fetchActiveWarehouseLocationCodes(this.warehouseLocationsRepository),
    ]);
    const shiftRows = filterByAssignedShift(allRows, query.shiftId);
    // "Supply" is specifically Warehouse Location -> Production Location —
    // pickup scanned from a Warehouse Location — see the daily summary
    // use-case for why this is the WAREHOUSE direction, not PRODUCTION.
    const rows = splitRowsByDirection(shiftRows, warehouseCodes).WAREHOUSE;
    const buckets = bucketRowsByShiftDay(rows, monthStart, monthEnd, shift);

    const perTrolley = new Map<
      string,
      {
        trolleyCode: string;
        trolleyName: string;
        trolleyTypeId: string;
        trolleyTypeName: string;
        totalCount: number;
        daysWithData: number;
      }
    >();
    for (const dayRows of buckets.values()) {
      for (const day of summarizeTrolleyFrequency(dayRows)) {
        const entry = perTrolley.get(day.trolleyId) ?? {
          trolleyCode: day.trolleyCode,
          trolleyName: day.trolleyName,
          trolleyTypeId: day.trolleyTypeId,
          trolleyTypeName: day.trolleyTypeName,
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
          trolleyTypeId: value.trolleyTypeId,
          trolleyTypeName: value.trolleyTypeName,
          count: Math.round(value.totalCount / divisor),
        };
      })
      .sort((a, b) => b.count - a.count);
  }
}
