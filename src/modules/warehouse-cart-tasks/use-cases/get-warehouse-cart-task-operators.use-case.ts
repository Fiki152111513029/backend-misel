import { Inject, Injectable } from '@nestjs/common';
import { WAREHOUSE_CART_TASKS_REPOSITORY } from '../repositories/warehouse-cart-task-repository.interface';
import type { IWarehouseCartTasksRepository } from '../repositories/warehouse-cart-task-repository.interface';

@Injectable()
export class GetWarehouseCartTaskOperatorsUseCase {
  constructor(
    @Inject(WAREHOUSE_CART_TASKS_REPOSITORY)
    private readonly warehouseCartTasksRepository: IWarehouseCartTasksRepository,
  ) {}

  execute() {
    return this.warehouseCartTasksRepository.findDistinctOperators();
  }
}
