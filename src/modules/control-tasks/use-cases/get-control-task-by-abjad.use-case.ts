import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { toControlTaskResponse } from '../entities/control-task.entity';
import { CONTROL_TASKS_REPOSITORY } from '../repositories/control-task-repository.interface';
import type { IControlTasksRepository } from '../repositories/control-task-repository.interface';

/**
 * Lookup by the value printed on the QR label, so scanning a Control Task
 * resolves to its route without the scanner needing to know the uuid.
 */
@Injectable()
export class GetControlTaskByAbjadUseCase {
  constructor(
    @Inject(CONTROL_TASKS_REPOSITORY)
    private readonly controlTasksRepository: IControlTasksRepository,
  ) {}

  async execute(abjad: string) {
    const controlTask = await this.controlTasksRepository.findByAbjad(
      abjad.trim(),
    );
    if (!controlTask) {
      throw new NotFoundException('Control Task not found');
    }
    return toControlTaskResponse(controlTask);
  }
}
