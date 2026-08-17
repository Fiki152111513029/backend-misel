import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TrolleyStatus } from '@prisma/client';
import { TROLLEYS_REPOSITORY } from '../../trolleys/repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../../trolleys/repositories/trolley-repository.interface';
import { USERS_REPOSITORY } from '../../users/repositories/users-repository.interface';
import type { IUsersRepository } from '../../users/repositories/users-repository.interface';
import { TaskOrderService, TaskOrderPayload } from '../../tasks/services/task-order.service';
import { generateOrderId } from '../../tasks/utils/generate-order-id';
import { CreateTrolleyActivityDto } from '../dto/create-trolley-activity.dto';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';

function toggleStatus(status: TrolleyStatus): TrolleyStatus {
  return status === TrolleyStatus.EMPTY ? TrolleyStatus.FULL : TrolleyStatus.EMPTY;
}

@Injectable()
export class CreateTrolleyActivityUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
    private readonly taskOrderService: TaskOrderService,
  ) {}

  async execute(dto: CreateTrolleyActivityDto, userId: string) {
    const trolley = await this.trolleysRepository.findById(dto.trolleyId);
    if (!trolley) {
      throw new BadRequestException('Trolley not found');
    }
    if (!trolley.droppingLocationCode) {
      throw new BadRequestException(
        'This trolley has no Dropping Location Code set — configure it on the Trolley first',
      );
    }
    if (!trolley.modelCodeProcess) {
      throw new BadRequestException(
        'This trolley has no Model Code Process configured — configure it on the Trolley first',
      );
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const statusBeginning = trolley.status;
    const statusEnd = toggleStatus(statusBeginning);
    const startDate = new Date(dto.startDate);
    const endDate = new Date();
    const taskPath = [dto.pickupLocationCode, trolley.droppingLocationCode].join(',');
    const orderId = generateOrderId();

    const rcsRequest: TaskOrderPayload = {
      modelProcessCode: trolley.modelCodeProcess.name,
      priority: user.priority,
      fromSystem: trolley.modelCodeProcess.fromSystem,
      orderId,
      taskOrderDetail: [{ taskPath }],
    };

    // Call RCS first — only persist the activity (and flip the trolley's
    // status) once the order is actually accepted, same ordering Mainline's
    // release-task flow uses.
    const rcsResponse = await this.taskOrderService.addTask(rcsRequest);

    const activity = await this.trolleyActivitiesRepository.create({
      userId,
      trolleyId: trolley.id,
      statusBeginning,
      statusEnd,
      pickupLocationCode: dto.pickupLocationCode,
      droppingLocationCode: trolley.droppingLocationCode,
      startDate,
      endDate,
      taskId: orderId,
    });

    await this.trolleysRepository.update(trolley.id, { status: statusEnd });

    return { activity, rcsRequest, rcsResponse };
  }
}
