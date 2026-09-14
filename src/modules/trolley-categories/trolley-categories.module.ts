import { Module } from '@nestjs/common';
import { TrolleyCategoryController } from './controllers/trolley-category.controller';
import { TROLLEY_CATEGORIES_REPOSITORY } from './repositories/trolley-category-repository.interface';
import { TrolleyCategoryRepository } from './repositories/trolley-category.repository';
import { CreateTrolleyCategoryUseCase } from './use-cases/create-trolley-category.use-case';
import { DeleteTrolleyCategoryUseCase } from './use-cases/delete-trolley-category.use-case';
import { GetTrolleyCategoryUseCase } from './use-cases/get-trolley-category.use-case';
import { GetTrolleyCategoriesUseCase } from './use-cases/get-trolley-categories.use-case';
import { UpdateTrolleyCategoryUseCase } from './use-cases/update-trolley-category.use-case';
import { ExportTrolleyCategoriesUseCase } from './use-cases/export-trolley-categories.use-case';
import { ImportTrolleyCategoriesUseCase } from './use-cases/import-trolley-categories.use-case';
import { ModelCodeProcessesModule } from '../model-code-processes/model-code-processes.module';

@Module({
  imports: [ModelCodeProcessesModule],
  controllers: [TrolleyCategoryController],
  providers: [
    {
      provide: TROLLEY_CATEGORIES_REPOSITORY,
      useClass: TrolleyCategoryRepository,
    },
    CreateTrolleyCategoryUseCase,
    GetTrolleyCategoriesUseCase,
    GetTrolleyCategoryUseCase,
    UpdateTrolleyCategoryUseCase,
    DeleteTrolleyCategoryUseCase,
    ExportTrolleyCategoriesUseCase,
    ImportTrolleyCategoriesUseCase,
  ],
  exports: [TROLLEY_CATEGORIES_REPOSITORY],
})
export class TrolleyCategoriesModule {}
