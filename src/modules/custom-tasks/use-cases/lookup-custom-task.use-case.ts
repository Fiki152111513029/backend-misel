import { Inject, Injectable } from '@nestjs/common';
import { CONTROL_TASKS_REPOSITORY } from '../../control-tasks/repositories/control-task-repository.interface';
import type { IControlTasksRepository } from '../../control-tasks/repositories/control-task-repository.interface';
import { resolveCustomTask } from './resolve-custom-task';

/**
 * Read-only step behind the scan: the operator sees exactly what will be sent
 * before anything reaches RCS. Nothing is written here.
 */
@Injectable()
export class LookupCustomTaskUseCase {
  constructor(
    @Inject(CONTROL_TASKS_REPOSITORY)
    private readonly controlTasksRepository: IControlTasksRepository,
  ) {}

  async execute(abjad: string) {
    const { preview } = await resolveCustomTask(
      this.controlTasksRepository,
      abjad,
    );
    return preview;
  }
}
