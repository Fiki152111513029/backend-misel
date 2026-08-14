import { Module } from '@nestjs/common';
import { WarehouseLocationController } from './controllers/warehouse-location.controller';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from './repositories/warehouse-location-repository.interface';
import { WarehouseLocationRepository } from './repositories/warehouse-location.repository';
import { CreateWarehouseLocationUseCase } from './use-cases/create-warehouse-location.use-case';
import { DeleteWarehouseLocationUseCase } from './use-cases/delete-warehouse-location.use-case';
import { GetWarehouseLocationUseCase } from './use-cases/get-warehouse-location.use-case';
import { GetWarehouseLocationsUseCase } from './use-cases/get-warehouse-locations.use-case';
import { UpdateWarehouseLocationUseCase } from './use-cases/update-warehouse-location.use-case';

@Module({
  controllers: [WarehouseLocationController],
  providers: [
    { provide: WAREHOUSE_LOCATIONS_REPOSITORY, useClass: WarehouseLocationRepository },
    CreateWarehouseLocationUseCase,
    GetWarehouseLocationsUseCase,
    GetWarehouseLocationUseCase,
    UpdateWarehouseLocationUseCase,
    DeleteWarehouseLocationUseCase,
  ],
  exports: [WAREHOUSE_LOCATIONS_REPOSITORY],
})
export class WarehouseLocationsModule {}
