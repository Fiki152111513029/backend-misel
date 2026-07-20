import { Module } from '@nestjs/common';
import { ProductionLineController } from './controllers/production-line.controller';
import { PRODUCTION_LINES_REPOSITORY } from './repositories/production-line-repository.interface';
import { ProductionLineRepository } from './repositories/production-line.repository';
import { CreateProductionLineUseCase } from './use-cases/create-production-line.use-case';
import { DeleteProductionLineUseCase } from './use-cases/delete-production-line.use-case';
import { GetProductionLineUseCase } from './use-cases/get-production-line.use-case';
import { GetProductionLinesUseCase } from './use-cases/get-production-lines.use-case';
import { UpdateProductionLineUseCase } from './use-cases/update-production-line.use-case';

@Module({
  controllers: [ProductionLineController],
  providers: [
    {
      provide: PRODUCTION_LINES_REPOSITORY,
      useClass: ProductionLineRepository,
    },
    CreateProductionLineUseCase,
    GetProductionLinesUseCase,
    GetProductionLineUseCase,
    UpdateProductionLineUseCase,
    DeleteProductionLineUseCase,
  ],
  exports: [PRODUCTION_LINES_REPOSITORY],
})
export class ProductionLinesModule {}
