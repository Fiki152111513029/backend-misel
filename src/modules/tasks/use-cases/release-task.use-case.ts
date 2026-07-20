import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { TaskAction } from '@prisma/client';
import { USERS_REPOSITORY } from '../../users/repositories/users-repository.interface';
import type { IUsersRepository } from '../../users/repositories/users-repository.interface';
import { ReleaseTaskDto } from '../dto/release-task.dto';
import { TaskOrderService } from '../services/task-order.service';
import { TASKS_REPOSITORY } from '../repositories/task-repository.interface';
import type { ITasksRepository } from '../repositories/task-repository.interface';

// Matches the reference Python client's order id: datetime.now().strftime("%Y%m%d%H%M%S")
function generateOrderId(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

@Injectable()
export class ReleaseTaskUseCase {
  constructor(
    @Inject(TASKS_REPOSITORY)
    private readonly tasksRepository: ITasksRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly taskOrderService: TaskOrderService,
  ) {}

  async execute(dto: ReleaseTaskDto, userId: string, userRole: string) {
    const area = await this.tasksRepository.findProductionLineAreaWithRelations(
      dto.productionLineAreaId,
    );
    if (!area) {
      throw new BadRequestException('Production Line Area not found');
    }

    // Super Admin may release tasks for any line; everyone else may only
    // release tasks for the production line they operate.
    if (userRole !== 'Super Admin' && area.productionLine.operatorId !== userId) {
      throw new ForbiddenException(
        'You can only release tasks for your own production line',
      );
    }

    const boxType = await this.tasksRepository.findActiveBoxTypeById(
      dto.boxTypeId,
    );
    if (!boxType) {
      throw new BadRequestException('Box Type not found');
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    let taskPath: string;
    let quarantineAreaId: string | undefined;
    if (dto.taskAction === TaskAction.AMBIL_FG) {
      taskPath = [
        area.iRaypleLocationCode,
        area.eximLocation.iRaypleLocationCode,
        area.emptyPalletLocation.iRaypleLocationCode,
        area.iRaypleLocationCode,
      ].join(',');
    } else {
      const quarantineArea =
        await this.tasksRepository.findFirstActiveQuarantineAreaByLineId(
          area.productionLine.quarantineLineId,
        );
      if (!quarantineArea) {
        throw new BadRequestException(
          "No Quarantine Area found for this production line's quarantine line",
        );
      }
      quarantineAreaId = quarantineArea.id;
      taskPath = [
        area.iRaypleLocationCode,
        quarantineArea.iRaypleLocationCode,
        area.emptyPalletLocation.iRaypleLocationCode,
        area.iRaypleLocationCode,
      ].join(',');
    }

    const orderId = generateOrderId();

    await this.taskOrderService.addTask({
      modelProcessCode: boxType.modelProcessCode,
      priority: user.priority,
      fromSystem: boxType.fromSystem,
      orderId,
      taskOrderDetail: [{ taskPath }],
    });

    return this.tasksRepository.create({
      taskId: orderId,
      taskAction: dto.taskAction,
      taskPath,
      productionLineId: area.productionLine.id,
      productionLineAreaId: area.id,
      quarantineAreaId,
      boxTypeId: boxType.id,
      operatorId: userId,
    });
  }
}
