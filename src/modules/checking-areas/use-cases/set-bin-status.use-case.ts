import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  NODE_STATUS_EMPTY,
  NODE_STATUS_FULL,
  RcsStockStatusService,
} from '../../rcs-stock-status/rcs-stock-status.service';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import { WarehouseLocationStatus } from '@prisma/client';
import type { BinStatus } from './get-checking-area.use-case';
import { RealtimeService } from '../../realtime/realtime.service';

@Injectable()
export class SetBinStatusUseCase {
  constructor(
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
    private readonly rcsStockStatusService: RcsStockStatusService,
    private readonly realtime: RealtimeService,
  ) {}

  async execute(code: string, status: BinStatus) {
    const location =
      await this.warehouseLocationsRepository.findActiveByLocationCode(code);
    if (!location) {
      throw new BadRequestException(
        `No active Warehouse Location has the code "${code}"`,
      );
    }

    // RCS first and it throws on refusal, so we never report a correction
    // that did not land. Our own copy is only updated once RCS agrees,
    // keeping the two from drifting further apart than they already were.
    await this.rcsStockStatusService.setStockStatus(
      code,
      status === 'FULL' ? NODE_STATUS_FULL : NODE_STATUS_EMPTY,
    );

    await this.warehouseLocationsRepository.update(location.id, {
      status:
        status === 'FULL'
          ? WarehouseLocationStatus.FULL
          : WarehouseLocationStatus.EMPTY,
    });

    // Another operator may be looking at the same bin on Checking Area,
    // or at the Factory Map node that draws from it.
    this.realtime.publish('stock');

    return { iRaypleLocationCode: code, stockStatus: status };
  }
}
