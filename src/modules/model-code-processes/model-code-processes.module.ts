import { Module } from '@nestjs/common';
import { ModelCodeProcessController } from './controllers/model-code-process.controller';
import { MODEL_CODE_PROCESSES_REPOSITORY } from './repositories/model-code-process-repository.interface';
import { ModelCodeProcessRepository } from './repositories/model-code-process.repository';
import { CreateModelCodeProcessUseCase } from './use-cases/create-model-code-process.use-case';
import { DeleteModelCodeProcessUseCase } from './use-cases/delete-model-code-process.use-case';
import { GetModelCodeProcessUseCase } from './use-cases/get-model-code-process.use-case';
import { GetModelCodeProcessesUseCase } from './use-cases/get-model-code-processes.use-case';
import { UpdateModelCodeProcessUseCase } from './use-cases/update-model-code-process.use-case';

@Module({
  controllers: [ModelCodeProcessController],
  providers: [
    {
      provide: MODEL_CODE_PROCESSES_REPOSITORY,
      useClass: ModelCodeProcessRepository,
    },
    CreateModelCodeProcessUseCase,
    GetModelCodeProcessesUseCase,
    GetModelCodeProcessUseCase,
    UpdateModelCodeProcessUseCase,
    DeleteModelCodeProcessUseCase,
  ],
  exports: [MODEL_CODE_PROCESSES_REPOSITORY],
})
export class ModelCodeProcessesModule {}
