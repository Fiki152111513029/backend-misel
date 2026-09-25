import { Module } from '@nestjs/common';
import { RackController } from './controllers/rack.controller';
import { RACKS_REPOSITORY } from './repositories/rack-repository.interface';
import { RackRepository } from './repositories/rack.repository';
import { CreateRackUseCase } from './use-cases/create-rack.use-case';
import { DeleteRackUseCase } from './use-cases/delete-rack.use-case';
import { GetRackUseCase } from './use-cases/get-rack.use-case';
import { GetRacksUseCase } from './use-cases/get-racks.use-case';
import { UpdateRackUseCase } from './use-cases/update-rack.use-case';

@Module({
  controllers: [RackController],
  providers: [
    { provide: RACKS_REPOSITORY, useClass: RackRepository },
    CreateRackUseCase,
    GetRacksUseCase,
    GetRackUseCase,
    UpdateRackUseCase,
    DeleteRackUseCase,
  ],
  exports: [RACKS_REPOSITORY],
})
export class RacksModule {}
