import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TASKS_REPOSITORY } from '../repositories/task-repository.interface';
import type { ITasksRepository } from '../repositories/task-repository.interface';

// "No urut" — this task's position among everything its own operator has
// ever released, ordered by creation time. Computed on demand from
// createdAt/operatorId (both already persisted) rather than a client-side
// counter, so it survives a page refresh instead of resetting to blank.
@Injectable()
export class GetTaskSequenceUseCase {
  constructor(
    @Inject(TASKS_REPOSITORY)
    private readonly tasksRepository: ITasksRepository,
  ) {}

  async execute(taskId: string) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    const sequenceNumber = await this.tasksRepository.countByOperatorUpTo(
      task.operatorId,
      task.createdAt,
    );
    return { sequenceNumber };
  }
}
