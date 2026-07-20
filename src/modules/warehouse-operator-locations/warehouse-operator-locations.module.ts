import { Module } from '@nestjs/common';
import { WarehouseOperatorLocationController } from './controllers/warehouse-operator-location.controller';
import { WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY } from './repositories/warehouse-operator-location-repository.interface';
import { WarehouseOperatorLocationRepository } from './repositories/warehouse-operator-location.repository';
import { CreateWarehouseOperatorLocationUseCase } from './use-cases/create-warehouse-operator-location.use-case';
import { DeleteWarehouseOperatorLocationUseCase } from './use-cases/delete-warehouse-operator-location.use-case';
import { GetAvailableOperatorsUseCase } from './use-cases/get-available-operators.use-case';
import { GetWarehouseOperatorLocationUseCase } from './use-cases/get-warehouse-operator-location.use-case';
import { GetWarehouseOperatorLocationsUseCase } from './use-cases/get-warehouse-operator-locations.use-case';
import { UpdateWarehouseOperatorLocationUseCase } from './use-cases/update-warehouse-operator-location.use-case';

@Module({
  controllers: [WarehouseOperatorLocationController],
  providers: [
    {
      provide: WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY,
      useClass: WarehouseOperatorLocationRepository,
    },
    CreateWarehouseOperatorLocationUseCase,
    GetWarehouseOperatorLocationsUseCase,
    GetWarehouseOperatorLocationUseCase,
    UpdateWarehouseOperatorLocationUseCase,
    DeleteWarehouseOperatorLocationUseCase,
    GetAvailableOperatorsUseCase,
  ],
  exports: [WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY],
})
export class WarehouseOperatorLocationsModule {}
