import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { TaskOrderService } from '../../tasks/services/task-order.service';
import { CUSTOM_TASK_RUNS_REPOSITORY } from '../repositories/custom-task-run-repository.interface';
import type { ICustomTaskRunsRepository } from '../repositories/custom-task-run-repository.interface';
import { RealtimeService } from '../../realtime/realtime.service';

@Injectable()
export class CancelCustomTaskRunUseCase {
  constructor(
    @Inject(CUSTOM_TASK_RUNS_REPOSITORY)
    private readonly customTaskRunsRepository: ICustomTaskRunsRepository,
    private readonly taskOrderService: TaskOrderService,
    private readonly realtime: RealtimeService,
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

    // A run still waiting for its rack was never sent anywhere, so there is
    // no RCS order to cancel — asking RCS to stop an id it has never seen
    // would just fail and leave the operator unable to clear their own
    // queued task. Dropping our row is the whole cancellation.
    if (!run.waitingForBinAt) {
      // RCS first, our own row second. If RCS refuses to stop the task the
      // error propagates and nothing is written, so the page can never
      // claim a task was cancelled while the robot is still driving it.
      //
      // deviceNumber is the robot's device serial. An order RCS has not
      // assigned to a robot yet has none — an empty string is sent and RCS
      // decides whether it can still cancel it.
      await this.taskOrderService.cancelTask({
        orderId: run.orderId,
        deviceNumber: run.robot?.amrDeviceSerialNo ?? '',
      });
    }

    const cancelled = await this.customTaskRunsRepository.cancel(id);
    this.realtime.publish('custom-tasks');
    return cancelled;
  }
}
