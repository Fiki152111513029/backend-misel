import { Module } from '@nestjs/common';
import { TrolleyTypeController } from './controllers/trolley-type.controller';
import { TROLLEY_TYPES_REPOSITORY } from './repositories/trolley-type-repository.interface';
import { TrolleyTypeRepository } from './repositories/trolley-type.repository';
import { CreateTrolleyTypeUseCase } from './use-cases/create-trolley-type.use-case';
import { DeleteTrolleyTypeUseCase } from './use-cases/delete-trolley-type.use-case';
import { GetTrolleyTypeUseCase } from './use-cases/get-trolley-type.use-case';
import { GetTrolleyTypesUseCase } from './use-cases/get-trolley-types.use-case';
import { UpdateTrolleyTypeUseCase } from './use-cases/update-trolley-type.use-case';

@Module({
  controllers: [TrolleyTypeController],
  providers: [
    { provide: TROLLEY_TYPES_REPOSITORY, useClass: TrolleyTypeRepository },
    CreateTrolleyTypeUseCase,
    GetTrolleyTypesUseCase,
    GetTrolleyTypeUseCase,
    UpdateTrolleyTypeUseCase,
    DeleteTrolleyTypeUseCase,
  ],
  exports: [TROLLEY_TYPES_REPOSITORY],
})
export class TrolleyTypesModule {}
