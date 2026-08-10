import { Module } from '@nestjs/common';
import { FactoryMapController } from './controllers/factory-map.controller';
import { FACTORY_MAPS_REPOSITORY } from './repositories/factory-map-repository.interface';
import { FactoryMapRepository } from './repositories/factory-map.repository';
import { CreateFactoryMapUseCase } from './use-cases/create-factory-map.use-case';
import { DeleteFactoryMapUseCase } from './use-cases/delete-factory-map.use-case';
import { GetFactoryMapUseCase } from './use-cases/get-factory-map.use-case';
import { GetFactoryMapsUseCase } from './use-cases/get-factory-maps.use-case';
import { GetLocationCodesUseCase } from './use-cases/get-location-codes.use-case';
import { UpdateFactoryMapUseCase } from './use-cases/update-factory-map.use-case';

@Module({
  controllers: [FactoryMapController],
  providers: [
    { provide: FACTORY_MAPS_REPOSITORY, useClass: FactoryMapRepository },
    CreateFactoryMapUseCase,
    GetFactoryMapsUseCase,
    GetFactoryMapUseCase,
    UpdateFactoryMapUseCase,
    DeleteFactoryMapUseCase,
    GetLocationCodesUseCase,
  ],
  exports: [FACTORY_MAPS_REPOSITORY],
})
export class FactoryMapsModule {}
