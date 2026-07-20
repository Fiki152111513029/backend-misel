import { Module } from '@nestjs/common';
import { QuarantineAreaController } from './controllers/quarantine-area.controller';
import { QUARANTINE_AREAS_REPOSITORY } from './repositories/quarantine-area-repository.interface';
import { QuarantineAreaRepository } from './repositories/quarantine-area.repository';
import { CreateQuarantineAreaUseCase } from './use-cases/create-quarantine-area.use-case';
import { DeleteQuarantineAreaUseCase } from './use-cases/delete-quarantine-area.use-case';
import { GetQuarantineAreaUseCase } from './use-cases/get-quarantine-area.use-case';
import { GetQuarantineAreasUseCase } from './use-cases/get-quarantine-areas.use-case';
import { UpdateQuarantineAreaUseCase } from './use-cases/update-quarantine-area.use-case';

@Module({
  controllers: [QuarantineAreaController],
  providers: [
    {
      provide: QUARANTINE_AREAS_REPOSITORY,
      useClass: QuarantineAreaRepository,
    },
    CreateQuarantineAreaUseCase,
    GetQuarantineAreasUseCase,
    GetQuarantineAreaUseCase,
    UpdateQuarantineAreaUseCase,
    DeleteQuarantineAreaUseCase,
  ],
  exports: [QUARANTINE_AREAS_REPOSITORY],
})
export class QuarantineAreasModule {}
