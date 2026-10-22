import { Inject, Injectable } from '@nestjs/common';
import { CONTROL_TASKS_REPOSITORY } from '../../control-tasks/repositories/control-task-repository.interface';
import type { IControlTasksRepository } from '../../control-tasks/repositories/control-task-repository.interface';

/**
 * The Control Tasks this operator may dispatch, for Custom Task's picker.
 *
 * Deliberately scoped to the signed-in user rather than taking a user id:
 * the whole point of registering tasks to people is that an operator sees
 * only their own, so letting the caller name someone else would undo it.
 */
@Injectable()
export class GetMyControlTasksUseCase {
  constructor(
    @Inject(CONTROL_TASKS_REPOSITORY)
    private readonly controlTasksRepository: IControlTasksRepository,
  ) {}

  async execute(userId: string) {
    const items = await this.controlTasksRepository.findAssignedToUser(userId);
    return items.map((task) => ({
      id: task.id,
      code: task.code,
      name: task.name,
      groupName: task.groupName,
      colorCode: task.colorCode,
      route: task.route,
      modelProcessCode: task.modelCodeProcess?.name ?? '',
    }));
  }
}
