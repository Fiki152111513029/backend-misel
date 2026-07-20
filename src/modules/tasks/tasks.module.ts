import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TaskController } from './controllers/task.controller';
import { TASKS_REPOSITORY } from './repositories/task-repository.interface';
import { TaskRepository } from './repositories/task.repository';
import { TaskOrderService } from './services/task-order.service';
import { GetTasksUseCase } from './use-cases/get-tasks.use-case';
import { ReleaseTaskUseCase } from './use-cases/release-task.use-case';

@Module({
  imports: [UsersModule],
  controllers: [TaskController],
  providers: [
    { provide: TASKS_REPOSITORY, useClass: TaskRepository },
    TaskOrderService,
    ReleaseTaskUseCase,
    GetTasksUseCase,
  ],
  exports: [TASKS_REPOSITORY, TaskOrderService],
})
export class TasksModule {}
