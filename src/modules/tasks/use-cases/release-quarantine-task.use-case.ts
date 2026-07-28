import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USERS_REPOSITORY } from '../../users/repositories/users-repository.interface';
import type { IUsersRepository } from '../../users/repositories/users-repository.interface';
import { TaskOrderService, TaskOrderPayload } from '../services/task-order.service';
import { TASKS_REPOSITORY } from '../repositories/task-repository.interface';
import type { ITasksRepository } from '../repositories/task-repository.interface';
import { generateOrderId } from '../utils/generate-order-id';

// Forwards an already-quarantined task onward to FG (Finished Goods) — a
// separate, shorter RCS order from the original release: taskPath is just
// [Quarantine Area code, EXIM Location code] (2 segments, not 4), and
// modelProcessCode comes from the task's Quarantine Line instead of its
// Box Type.
@Injectable()
export class ReleaseQuarantineTaskUseCase {
  constructor(
    @Inject(TASKS_REPOSITORY)
    private readonly tasksRepository: ITasksRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly taskOrderService: TaskOrderService,
  ) {}

  async execute(taskId: string, userId: string) {
    const task = await this.tasksRepository.findByIdForQuarantineRelease(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    if (!task.quarantineArea) {
      throw new BadRequestException(
        'This task has no Quarantine Area to release from',
      );
    }
    if (!task.productionLineArea) {
      throw new BadRequestException(
        'This task has no Production Line Area / EXIM Location to release to',
      );
    }
    const modelCodeProcess = task.productionLine.quarantineLine.modelCodeProcess;
    if (!modelCodeProcess) {
      throw new BadRequestException(
        "This task's Quarantine Line has no Model Code Process configured",
      );
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const taskPath = [
      task.quarantineArea.iRaypleLocationCode,
      task.productionLineArea.eximLocation.iRaypleLocationCode,
    ].join(',');

    const rcsRequest: TaskOrderPayload = {
      modelProcessCode: modelCodeProcess.name,
      priority: user.priority,
      fromSystem: task.boxType.fromSystem,
      orderId: generateOrderId(),
      taskOrderDetail: [{ taskPath }],
    };

    const rcsResponse = await this.taskOrderService.addTask(rcsRequest);

    return { rcsRequest, rcsResponse };
  }
}
