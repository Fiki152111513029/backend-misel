import { Inject, Injectable } from '@nestjs/common';
import { CONTROL_TASKS_REPOSITORY } from '../repositories/control-task-repository.interface';
import type { IControlTasksRepository } from '../repositories/control-task-repository.interface';

/**
 * The legs a route can be built from. Served here rather than having the form
 * call the Production/Warehouse Location endpoints directly, so managing
 * Control Tasks needs only control-task.read.
 */
@Injectable()
export class GetRouteOptionsUseCase {
  constructor(
    @Inject(CONTROL_TASKS_REPOSITORY)
    private readonly controlTasksRepository: IControlTasksRepository,
  ) {}

  async execute() {
    const options = await this.controlTasksRepository.findRouteOptions();
    return {
      production: options.filter((option) => option.source === 'PRODUCTION'),
      warehouse: options.filter((option) => option.source === 'WAREHOUSE'),
    };
  }
}
