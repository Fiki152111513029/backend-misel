import { Module } from '@nestjs/common';
import { RcsStockStatusModule } from '../rcs-stock-status/rcs-stock-status.module';
import { WarehouseLocationsModule } from '../warehouse-locations/warehouse-locations.module';
import { CheckingAreaController } from './controllers/checking-area.controller';
import { GetCheckingAreaUseCase } from './use-cases/get-checking-area.use-case';
import { SetBinStatusUseCase } from './use-cases/set-bin-status.use-case';

// Control System > Checking Area: shows what RCS thinks each Warehouse
// Location bin holds, so an operator standing on the floor can correct it
// when the two disagree. Owns no tables — the locations come from
// WarehouseLocationsModule and the bin status from RCS.
@Module({
  imports: [WarehouseLocationsModule, RcsStockStatusModule],
  controllers: [CheckingAreaController],
  providers: [GetCheckingAreaUseCase, SetBinStatusUseCase],
})
export class CheckingAreasModule {}
