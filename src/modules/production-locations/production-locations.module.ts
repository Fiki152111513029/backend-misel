import { Module } from '@nestjs/common';
import { ProductionLocationController } from './controllers/production-location.controller';
import { PRODUCTION_LOCATIONS_REPOSITORY } from './repositories/production-location-repository.interface';
import { ProductionLocationRepository } from './repositories/production-location.repository';
import { CreateProductionLocationUseCase } from './use-cases/create-production-location.use-case';
import { DeleteProductionLocationUseCase } from './use-cases/delete-production-location.use-case';
import { GetProductionLocationUseCase } from './use-cases/get-production-location.use-case';
import { GetProductionLocationsUseCase } from './use-cases/get-production-locations.use-case';
import { UpdateProductionLocationUseCase } from './use-cases/update-production-location.use-case';

@Module({
  controllers: [ProductionLocationController],
  providers: [
    { provide: PRODUCTION_LOCATIONS_REPOSITORY, useClass: ProductionLocationRepository },
    CreateProductionLocationUseCase,
    GetProductionLocationsUseCase,
    GetProductionLocationUseCase,
    UpdateProductionLocationUseCase,
    DeleteProductionLocationUseCase,
  ],
  exports: [PRODUCTION_LOCATIONS_REPOSITORY],
})
export class ProductionLocationsModule {}
