import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { toControlTaskResponse } from '../entities/control-task.entity';
import { CONTROL_TASKS_REPOSITORY } from '../repositories/control-task-repository.interface';
import type { IControlTasksRepository } from '../repositories/control-task-repository.interface';

@Injectable()
export class GetControlTaskUseCase {
  constructor(
    @Inject(CONTROL_TASKS_REPOSITORY)
    private readonly controlTasksRepository: IControlTasksRepository,
  ) {}

  async execute(id: string) {
    const controlTask = await this.controlTasksRepository.findById(id);
    if (!controlTask) {
      throw new NotFoundException('Control Task not found');
    }
    return toControlTaskResponse(controlTask);
  }
}
