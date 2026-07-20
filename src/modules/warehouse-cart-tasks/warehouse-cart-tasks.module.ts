import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { WarehouseLineLocationsModule } from '../warehouse-line-locations/warehouse-line-locations.module';
import { WarehouseOperatorLocationsModule } from '../warehouse-operator-locations/warehouse-operator-locations.module';
import { WarehouseCartTaskController } from './controllers/warehouse-cart-task.controller';
import { WAREHOUSE_CART_TASKS_REPOSITORY } from './repositories/warehouse-cart-task-repository.interface';
import { WarehouseCartTaskRepository } from './repositories/warehouse-cart-task.repository';
import { GetWarehouseCartTasksUseCase } from './use-cases/get-warehouse-cart-tasks.use-case';
import { ReleaseWarehouseCartTaskUseCase } from './use-cases/release-warehouse-cart-task.use-case';

@Module({
  imports: [
    WarehouseLineLocationsModule,
    WarehouseOperatorLocationsModule,
    TasksModule,
  ],
  controllers: [WarehouseCartTaskController],
  providers: [
    {
      provide: WAREHOUSE_CART_TASKS_REPOSITORY,
      useClass: WarehouseCartTaskRepository,
    },
    ReleaseWarehouseCartTaskUseCase,
    GetWarehouseCartTasksUseCase,
  ],
  exports: [WAREHOUSE_CART_TASKS_REPOSITORY],
})
export class WarehouseCartTasksModule {}
