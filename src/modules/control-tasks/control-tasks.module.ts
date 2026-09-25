import { Module } from '@nestjs/common';
import { ControlTaskController } from './controllers/control-task.controller';
import { CONTROL_TASKS_REPOSITORY } from './repositories/control-task-repository.interface';
import { ControlTaskRepository } from './repositories/control-task.repository';
import { CreateControlTaskUseCase } from './use-cases/create-control-task.use-case';
import { DeleteControlTaskUseCase } from './use-cases/delete-control-task.use-case';
import { GetControlTaskByAbjadUseCase } from './use-cases/get-control-task-by-abjad.use-case';
import { GetControlTaskUseCase } from './use-cases/get-control-task.use-case';
import { GetControlTasksUseCase } from './use-cases/get-control-tasks.use-case';
import { GetRouteOptionsUseCase } from './use-cases/get-route-options.use-case';
import { UpdateControlTaskUseCase } from './use-cases/update-control-task.use-case';

@Module({
  controllers: [ControlTaskController],
  providers: [
    { provide: CONTROL_TASKS_REPOSITORY, useClass: ControlTaskRepository },
    CreateControlTaskUseCase,
    GetControlTasksUseCase,
    GetControlTaskUseCase,
    GetControlTaskByAbjadUseCase,
    GetRouteOptionsUseCase,
    UpdateControlTaskUseCase,
    DeleteControlTaskUseCase,
  ],
  exports: [CONTROL_TASKS_REPOSITORY],
})
export class ControlTasksModule {}
