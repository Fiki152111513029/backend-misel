import { Inject, Injectable } from '@nestjs/common';
import { CustomTaskRunQueryDto } from '../dto/custom-task-run-query.dto';
import { CUSTOM_TASK_RUNS_REPOSITORY } from '../repositories/custom-task-run-repository.interface';
import type { ICustomTaskRunsRepository } from '../repositories/custom-task-run-repository.interface';

@Injectable()
export class GetCustomTaskRunsUseCase {
  constructor(
    @Inject(CUSTOM_TASK_RUNS_REPOSITORY)
    private readonly customTaskRunsRepository: ICustomTaskRunsRepository,
  ) {}

  async execute(query: CustomTaskRunQueryDto) {
    const { items, total } = await this.customTaskRunsRepository.findAll(query);

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
