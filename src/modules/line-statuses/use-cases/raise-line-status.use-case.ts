import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { LineStatusKind } from '@prisma/client';
import { CONTROL_TASKS_REPOSITORY } from '../../control-tasks/repositories/control-task-repository.interface';
import type { IControlTasksRepository } from '../../control-tasks/repositories/control-task-repository.interface';
import { RealtimeService } from '../../realtime/realtime.service';
import { LINE_STATUSES_REPOSITORY } from '../repositories/line-status-repository.interface';
import type { ILineStatusesRepository } from '../repositories/line-status-repository.interface';
import { toLineStatusResponse } from './to-line-status-response';

/**
 * An operator presses one of the four buttons at the foot of their group.
 *
 * The group is checked against the caller's own task list rather than
 * trusted from the request: the buttons are rendered per group in Custom
 * Task, and without this anyone holding a token could announce that a line
 * they have never worked is asking for a changeover.
 */
@Injectable()
export class RaiseLineStatusUseCase {
  constructor(
    @Inject(LINE_STATUSES_REPOSITORY)
    private readonly lineStatusesRepository: ILineStatusesRepository,
    @Inject(CONTROL_TASKS_REPOSITORY)
    private readonly controlTasksRepository: IControlTasksRepository,
    private readonly realtime: RealtimeService,
  ) {}

  async execute(userId: string, groupName: string, kind: LineStatusKind) {
    const myTasks = await this.controlTasksRepository.findAssignedToUser(
      userId,
    );
    const mayAnnounce = myTasks.some(
      (task) => task.groupName === groupName && task.lineStatusEnabled,
    );
    if (!mayAnnounce) {
      throw new ForbiddenException(
        `You have no task in group "${groupName}" with the line-status buttons switched on`,
      );
    }

    const status = await this.lineStatusesRepository.upsert(
      groupName,
      kind,
      userId,
    );

    // A signal, not the row itself: unlike a warehouse notice there IS
    // something to fetch afterwards, so Checking Area refetches through
    // the endpoint that already has the permission check and the shape.
    this.realtime.publish('line-status');

    return toLineStatusResponse(status);
  }
}
