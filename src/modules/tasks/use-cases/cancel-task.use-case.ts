import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { TASKS_REPOSITORY } from '../repositories/task-repository.interface';
import type { ITasksRepository } from '../repositories/task-repository.interface';

@Injectable()
export class CancelTaskUseCase {
  constructor(
    @Inject(TASKS_REPOSITORY)
    private readonly tasksRepository: ITasksRepository,
  ) {}

  async execute(id: string) {
    const task = await this.tasksRepository.findById(id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (
      task.status === TaskStatus.COMPLETED ||
      task.status === TaskStatus.FAILED
    ) {
      throw new BadRequestException(
        'Only pending or in-progress tasks can be cancelled',
      );
    }

    // Marks the task as failed in our own database only — this does not
    // notify the external ICS/RCS fleet server to stop the robot.
    return this.tasksRepository.updateStatus(id, TaskStatus.FAILED);
  }
}
