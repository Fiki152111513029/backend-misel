import { Inject, Injectable } from '@nestjs/common';
import { ControlTaskQueryDto } from '../dto/control-task-query.dto';
import { toControlTaskResponse } from '../entities/control-task.entity';
import { CONTROL_TASKS_REPOSITORY } from '../repositories/control-task-repository.interface';
import type { IControlTasksRepository } from '../repositories/control-task-repository.interface';

@Injectable()
export class GetControlTasksUseCase {
  constructor(
    @Inject(CONTROL_TASKS_REPOSITORY)
    private readonly controlTasksRepository: IControlTasksRepository,
  ) {}

  async execute(query: ControlTaskQueryDto) {
    const { items, total } = await this.controlTasksRepository.findAll(query);

    return {
      items: items.map(toControlTaskResponse),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
