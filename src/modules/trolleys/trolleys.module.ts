import { Module } from '@nestjs/common';
import { ProductionLocationsModule } from '../production-locations/production-locations.module';
import { TrolleyTypesModule } from '../trolley-types/trolley-types.module';
import { TrolleyCategoriesModule } from '../trolley-categories/trolley-categories.module';
import { ModelCodeProcessesModule } from '../model-code-processes/model-code-processes.module';
import { CustomersModule } from '../customers/customers.module';
import { TrolleyController } from './controllers/trolley.controller';
import { TROLLEYS_REPOSITORY } from './repositories/trolley-repository.interface';
import { TrolleyRepository } from './repositories/trolley.repository';
import { CreateTrolleyUseCase } from './use-cases/create-trolley.use-case';
import { DeleteTrolleyUseCase } from './use-cases/delete-trolley.use-case';
import { GetTrolleyUseCase } from './use-cases/get-trolley.use-case';
import { GetTrolleysUseCase } from './use-cases/get-trolleys.use-case';
import { UpdateTrolleyUseCase } from './use-cases/update-trolley.use-case';
import { ExportTrolleysUseCase } from './use-cases/export-trolleys.use-case';
import { ImportTrolleysUseCase } from './use-cases/import-trolleys.use-case';

@Module({
  imports: [
    ProductionLocationsModule,
    TrolleyTypesModule,
    TrolleyCategoriesModule,
    ModelCodeProcessesModule,
    CustomersModule,
  ],
  controllers: [TrolleyController],
  providers: [
    { provide: TROLLEYS_REPOSITORY, useClass: TrolleyRepository },
    CreateTrolleyUseCase,
    GetTrolleysUseCase,
    GetTrolleyUseCase,
    UpdateTrolleyUseCase,
    DeleteTrolleyUseCase,
    ExportTrolleysUseCase,
    ImportTrolleysUseCase,
  ],
  exports: [TROLLEYS_REPOSITORY],
})
export class TrolleysModule {}
