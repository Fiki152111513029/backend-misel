import { Module } from '@nestjs/common';
import { ControlTasksModule } from '../control-tasks/control-tasks.module';
import { FactoryMapsModule } from '../factory-maps/factory-maps.module';
import { RcsStockStatusModule } from '../rcs-stock-status/rcs-stock-status.module';
import { TasksModule } from '../tasks/tasks.module';
import { WarehouseLocationsModule } from '../warehouse-locations/warehouse-locations.module';
import { CustomTaskController } from './controllers/custom-task.controller';
import { CUSTOM_TASK_RUNS_REPOSITORY } from './repositories/custom-task-run-repository.interface';
import { CustomTaskRunRepository } from './repositories/custom-task-run.repository';
import { CancelCustomTaskRunUseCase } from './use-cases/cancel-custom-task-run.use-case';
import { GetCustomTaskRunsUseCase } from './use-cases/get-custom-task-runs.use-case';
import { LookupCustomTaskUseCase } from './use-cases/lookup-custom-task.use-case';
import { ReleaseCustomTaskUseCase } from './use-cases/release-custom-task.use-case';

// The operator-facing side of Customize Control Task: scan an code, confirm
// what it resolves to, send it to RCS. It owns no tables of its own — the
// Control Task rows come from ControlTasksModule and the RCS call from
// TasksModule.
@Module({
  imports: [
    ControlTasksModule,
    TasksModule,
    // Releasing a task first checks the route's Warehouse Location bins
    // against RCS — see assertWarehouseBinsReady.
    WarehouseLocationsModule,
    FactoryMapsModule,
    RcsStockStatusModule,
  ],
  controllers: [CustomTaskController],
  providers: [
    { provide: CUSTOM_TASK_RUNS_REPOSITORY, useClass: CustomTaskRunRepository },
    LookupCustomTaskUseCase,
    ReleaseCustomTaskUseCase,
    GetCustomTaskRunsUseCase,
    CancelCustomTaskRunUseCase,
  ],
  exports: [CUSTOM_TASK_RUNS_REPOSITORY],
})
export class CustomTasksModule {}
