import { Module } from '@nestjs/common';
import { QuarantineLineController } from './controllers/quarantine-line.controller';
import { QUARANTINE_LINES_REPOSITORY } from './repositories/quarantine-line-repository.interface';
import { QuarantineLineRepository } from './repositories/quarantine-line.repository';
import { CreateQuarantineLineUseCase } from './use-cases/create-quarantine-line.use-case';
import { DeleteQuarantineLineUseCase } from './use-cases/delete-quarantine-line.use-case';
import { GetQuarantineLineUseCase } from './use-cases/get-quarantine-line.use-case';
import { GetQuarantineLinesUseCase } from './use-cases/get-quarantine-lines.use-case';
import { UpdateQuarantineLineUseCase } from './use-cases/update-quarantine-line.use-case';

@Module({
  controllers: [QuarantineLineController],
  providers: [
    {
      provide: QUARANTINE_LINES_REPOSITORY,
      useClass: QuarantineLineRepository,
    },
    CreateQuarantineLineUseCase,
    GetQuarantineLinesUseCase,
    GetQuarantineLineUseCase,
    UpdateQuarantineLineUseCase,
    DeleteQuarantineLineUseCase,
  ],
  exports: [QUARANTINE_LINES_REPOSITORY],
})
export class QuarantineLinesModule {}
