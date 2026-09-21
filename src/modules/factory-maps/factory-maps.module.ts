import { Module } from '@nestjs/common';
import { ChargerAreasModule } from '../charger-areas/charger-areas.module';
import { ParkingAreasModule } from '../parking-areas/parking-areas.module';
import { ProductionLocationsModule } from '../production-locations/production-locations.module';
import { RcsStockStatusModule } from '../rcs-stock-status/rcs-stock-status.module';
import { WarehouseLocationsModule } from '../warehouse-locations/warehouse-locations.module';
import { FactoryMapController } from './controllers/factory-map.controller';
import { FACTORY_MAPS_REPOSITORY } from './repositories/factory-map-repository.interface';
import { FactoryMapRepository } from './repositories/factory-map.repository';
import { CreateFactoryMapUseCase } from './use-cases/create-factory-map.use-case';
import { DeleteFactoryMapUseCase } from './use-cases/delete-factory-map.use-case';
import { GetFactoryMapUseCase } from './use-cases/get-factory-map.use-case';
import { GetFactoryMapsUseCase } from './use-cases/get-factory-maps.use-case';
import { GetLocationCodesUseCase } from './use-cases/get-location-codes.use-case';
import { GetStockStatusUseCase } from './use-cases/get-stock-status.use-case';
import { SyncTopologyLocationsUseCase } from './use-cases/sync-topology-locations.use-case';
import { UpdateFactoryMapUseCase } from './use-cases/update-factory-map.use-case';

@Module({
  imports: [
    RcsStockStatusModule,
    ChargerAreasModule,
    ParkingAreasModule,
    ProductionLocationsModule,
    WarehouseLocationsModule,
  ],
  controllers: [FactoryMapController],
  providers: [
    { provide: FACTORY_MAPS_REPOSITORY, useClass: FactoryMapRepository },
    CreateFactoryMapUseCase,
    GetFactoryMapsUseCase,
    GetFactoryMapUseCase,
    UpdateFactoryMapUseCase,
    DeleteFactoryMapUseCase,
    GetLocationCodesUseCase,
    GetStockStatusUseCase,
    SyncTopologyLocationsUseCase,
  ],
  exports: [FACTORY_MAPS_REPOSITORY],
})
export class FactoryMapsModule {}
