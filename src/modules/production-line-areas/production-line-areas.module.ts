import { Module } from '@nestjs/common';
import { ProductionLineAreaController } from './controllers/production-line-area.controller';
import { PRODUCTION_LINE_AREAS_REPOSITORY } from './repositories/production-line-area-repository.interface';
import { ProductionLineAreaRepository } from './repositories/production-line-area.repository';
import { CreateProductionLineAreaUseCase } from './use-cases/create-production-line-area.use-case';
import { DeleteProductionLineAreaUseCase } from './use-cases/delete-production-line-area.use-case';
import { GetProductionLineAreaUseCase } from './use-cases/get-production-line-area.use-case';
import { GetProductionLineAreasUseCase } from './use-cases/get-production-line-areas.use-case';
import { ReorderProductionLineAreasUseCase } from './use-cases/reorder-production-line-areas.use-case';
import { UpdateProductionLineAreaUseCase } from './use-cases/update-production-line-area.use-case';

@Module({
  controllers: [ProductionLineAreaController],
  providers: [
    {
      provide: PRODUCTION_LINE_AREAS_REPOSITORY,
      useClass: ProductionLineAreaRepository,
    },
    CreateProductionLineAreaUseCase,
    GetProductionLineAreasUseCase,
    GetProductionLineAreaUseCase,
    UpdateProductionLineAreaUseCase,
    DeleteProductionLineAreaUseCase,
    ReorderProductionLineAreasUseCase,
  ],
  exports: [PRODUCTION_LINE_AREAS_REPOSITORY],
})
export class ProductionLineAreasModule {}
