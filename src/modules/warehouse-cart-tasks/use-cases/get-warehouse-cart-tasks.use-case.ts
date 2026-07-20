import { Inject, Injectable } from '@nestjs/common';
import { WarehouseCartTaskQueryDto } from '../dto/warehouse-cart-task-query.dto';
import { WAREHOUSE_CART_TASKS_REPOSITORY } from '../repositories/warehouse-cart-task-repository.interface';
import type { IWarehouseCartTasksRepository } from '../repositories/warehouse-cart-task-repository.interface';

@Injectable()
export class GetWarehouseCartTasksUseCase {
  constructor(
    @Inject(WAREHOUSE_CART_TASKS_REPOSITORY)
    private readonly warehouseCartTasksRepository: IWarehouseCartTasksRepository,
  ) {}

  async execute(query: WarehouseCartTaskQueryDto) {
    const { items, total } =
      await this.warehouseCartTasksRepository.findAll(query);

    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
