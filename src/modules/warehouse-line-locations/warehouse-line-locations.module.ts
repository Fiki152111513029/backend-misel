import { Module } from '@nestjs/common';
import { ModelCodeProcessesModule } from '../model-code-processes/model-code-processes.module';
import { WarehouseLocationsModule } from '../warehouse-locations/warehouse-locations.module';
import { ProductionLocationsModule } from '../production-locations/production-locations.module';
import { WarehouseLineLocationController } from './controllers/warehouse-line-location.controller';
import { WAREHOUSE_LINE_LOCATIONS_REPOSITORY } from './repositories/warehouse-line-location-repository.interface';
import { WarehouseLineLocationRepository } from './repositories/warehouse-line-location.repository';
import { CreateWarehouseLineLocationUseCase } from './use-cases/create-warehouse-line-location.use-case';
import { DeleteWarehouseLineLocationUseCase } from './use-cases/delete-warehouse-line-location.use-case';
import { GetWarehouseLineLocationUseCase } from './use-cases/get-warehouse-line-location.use-case';
import { GetWarehouseLineLocationsUseCase } from './use-cases/get-warehouse-line-locations.use-case';
import { UpdateWarehouseLineLocationUseCase } from './use-cases/update-warehouse-line-location.use-case';

@Module({
  imports: [ModelCodeProcessesModule, WarehouseLocationsModule, ProductionLocationsModule],
  controllers: [WarehouseLineLocationController],
  providers: [
    {
      provide: WAREHOUSE_LINE_LOCATIONS_REPOSITORY,
      useClass: WarehouseLineLocationRepository,
    },
    CreateWarehouseLineLocationUseCase,
    GetWarehouseLineLocationsUseCase,
    GetWarehouseLineLocationUseCase,
    UpdateWarehouseLineLocationUseCase,
    DeleteWarehouseLineLocationUseCase,
  ],
  exports: [WAREHOUSE_LINE_LOCATIONS_REPOSITORY],
})
export class WarehouseLineLocationsModule {}
