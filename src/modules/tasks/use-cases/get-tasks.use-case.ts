import { Inject, Injectable } from '@nestjs/common';
import { TaskQueryDto } from '../dto/task-query.dto';
import { TASKS_REPOSITORY } from '../repositories/task-repository.interface';
import type { ITasksRepository } from '../repositories/task-repository.interface';
import { TaskOrderService } from '../services/task-order.service';

@Injectable()
export class GetTasksUseCase {
  constructor(
    @Inject(TASKS_REPOSITORY)
    private readonly tasksRepository: ITasksRepository,
    private readonly taskOrderService: TaskOrderService,
  ) {}

  async execute(query: TaskQueryDto) {
    const { items, total } = await this.tasksRepository.findAll(query);
    const merged = await this.taskOrderService.mergeWithLiveOrders(items);

    return {
      items: merged,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
