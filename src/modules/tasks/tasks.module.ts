import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TaskController } from './controllers/task.controller';
import { TASKS_REPOSITORY } from './repositories/task-repository.interface';
import { TaskRepository } from './repositories/task.repository';
import { TaskOrderService } from './services/task-order.service';
import { CancelTaskUseCase } from './use-cases/cancel-task.use-case';
import { GetTaskOperatorsUseCase } from './use-cases/get-task-operators.use-case';
import { GetTasksUseCase } from './use-cases/get-tasks.use-case';
import { ReleaseTaskUseCase } from './use-cases/release-task.use-case';
import { ReleaseQuarantineTaskUseCase } from './use-cases/release-quarantine-task.use-case';

@Module({
  imports: [UsersModule],
  controllers: [TaskController],
  providers: [
    { provide: TASKS_REPOSITORY, useClass: TaskRepository },
    TaskOrderService,
    ReleaseTaskUseCase,
    ReleaseQuarantineTaskUseCase,
    GetTasksUseCase,
    GetTaskOperatorsUseCase,
    CancelTaskUseCase,
  ],
  exports: [TASKS_REPOSITORY, TaskOrderService],
})
export class TasksModule {}
