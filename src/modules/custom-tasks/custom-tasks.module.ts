import { Module } from '@nestjs/common';
import { ControlTasksModule } from '../control-tasks/control-tasks.module';
import { TasksModule } from '../tasks/tasks.module';
import { CustomTaskController } from './controllers/custom-task.controller';
import { LookupCustomTaskUseCase } from './use-cases/lookup-custom-task.use-case';
import { ReleaseCustomTaskUseCase } from './use-cases/release-custom-task.use-case';

// The operator-facing side of Customize Control Task: scan an abjad, confirm
// what it resolves to, send it to RCS. It owns no tables of its own — the
// Control Task rows come from ControlTasksModule and the RCS call from
// TasksModule.
@Module({
  imports: [ControlTasksModule, TasksModule],
  controllers: [CustomTaskController],
  providers: [LookupCustomTaskUseCase, ReleaseCustomTaskUseCase],
})
export class CustomTasksModule {}
