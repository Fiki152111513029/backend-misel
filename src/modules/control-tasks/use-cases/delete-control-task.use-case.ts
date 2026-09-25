import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CONTROL_TASKS_REPOSITORY } from '../repositories/control-task-repository.interface';
import type { IControlTasksRepository } from '../repositories/control-task-repository.interface';

@Injectable()
export class DeleteControlTaskUseCase {
  constructor(
    @Inject(CONTROL_TASKS_REPOSITORY)
    private readonly controlTasksRepository: IControlTasksRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.controlTasksRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Control Task not found');
    }

    await this.controlTasksRepository.softDelete(id);
  }
}
