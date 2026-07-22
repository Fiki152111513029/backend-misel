import { Inject, Injectable } from '@nestjs/common';
import { TASKS_REPOSITORY } from '../repositories/task-repository.interface';
import type { ITasksRepository } from '../repositories/task-repository.interface';

@Injectable()
export class GetTaskOperatorsUseCase {
  constructor(
    @Inject(TASKS_REPOSITORY)
    private readonly tasksRepository: ITasksRepository,
  ) {}

  execute() {
    return this.tasksRepository.findDistinctOperators();
  }
}
