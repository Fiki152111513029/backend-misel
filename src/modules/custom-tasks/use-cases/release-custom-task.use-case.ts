import { Inject, Injectable } from '@nestjs/common';
import { CONTROL_TASKS_REPOSITORY } from '../../control-tasks/repositories/control-task-repository.interface';
import type { IControlTasksRepository } from '../../control-tasks/repositories/control-task-repository.interface';
import { TaskOrderService } from '../../tasks/services/task-order.service';
import { generateOrderId } from '../../tasks/utils/generate-order-id';
import { resolveCustomTask } from './resolve-custom-task';

@Injectable()
export class ReleaseCustomTaskUseCase {
  constructor(
    @Inject(CONTROL_TASKS_REPOSITORY)
    private readonly controlTasksRepository: IControlTasksRepository,
    private readonly taskOrderService: TaskOrderService,
  ) {}

  async execute(abjad: string) {
    const { preview } = await resolveCustomTask(
      this.controlTasksRepository,
      abjad,
    );

    // The abjad prefixes the usual %Y%m%d%H%M%S order id, so an order coming
    // back from RCS (or a webhook) says at a glance which Control Task it
    // came from, and two Control Tasks released in the same second cannot
    // collide on the same id.
    const orderId = `${preview.abjad}${generateOrderId()}`;

    await this.taskOrderService.addTask({
      modelProcessCode: preview.modelProcessCode,
      priority: preview.priority,
      fromSystem: preview.fromSystem,
      orderId,
      taskOrderDetail: [{ taskPath: preview.taskPath }],
    });

    return { ...preview, orderId, releasedAt: new Date() };
  }
}
