import { Module } from '@nestjs/common';
import { TrolleyController } from './controllers/trolley.controller';
import { TROLLEYS_REPOSITORY } from './repositories/trolley-repository.interface';
import { TrolleyRepository } from './repositories/trolley.repository';
import { CreateTrolleyUseCase } from './use-cases/create-trolley.use-case';
import { DeleteTrolleyUseCase } from './use-cases/delete-trolley.use-case';
import { GetTrolleyUseCase } from './use-cases/get-trolley.use-case';
import { GetTrolleysUseCase } from './use-cases/get-trolleys.use-case';
import { UpdateTrolleyUseCase } from './use-cases/update-trolley.use-case';

@Module({
  controllers: [TrolleyController],
  providers: [
    { provide: TROLLEYS_REPOSITORY, useClass: TrolleyRepository },
    CreateTrolleyUseCase,
    GetTrolleysUseCase,
    GetTrolleyUseCase,
    UpdateTrolleyUseCase,
    DeleteTrolleyUseCase,
  ],
  exports: [TROLLEYS_REPOSITORY],
})
export class TrolleysModule {}
