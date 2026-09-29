import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { CUSTOM_TASK_RUNS_REPOSITORY } from '../repositories/custom-task-run-repository.interface';
import type { ICustomTaskRunsRepository } from '../repositories/custom-task-run-repository.interface';

@Injectable()
export class CancelCustomTaskRunUseCase {
  constructor(
    @Inject(CUSTOM_TASK_RUNS_REPOSITORY)
    private readonly customTaskRunsRepository: ICustomTaskRunsRepository,
  ) {}

  async execute(id: string) {
    const run = await this.customTaskRunsRepository.findById(id);
    if (!run) {
      throw new NotFoundException('Custom Task run not found');
    }

    if (
      run.status === TaskStatus.COMPLETED ||
      run.status === TaskStatus.FAILED
    ) {
      throw new BadRequestException(
        'Only pending or in-progress custom tasks can be cancelled',
      );
    }

    // Marks it cancelled in our own database only. RCS exposes no cancel
    // endpoint in this integration (see config/configuration.ts taskOrder,
    // which only has addTask/getOrderList/getTaskOrderStatus), so the robot
    // itself is NOT stopped by this — exactly the same limitation the
    // Tasks page's own cancel already has. A later task-status webhook for
    // this order can still move the row on.
    return this.customTaskRunsRepository.cancel(id);
  }
}
