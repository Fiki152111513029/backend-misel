import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { UpdateControlTaskDto } from '../dto/update-control-task.dto';
import { toControlTaskResponse } from '../entities/control-task.entity';
import { CONTROL_TASKS_REPOSITORY } from '../repositories/control-task-repository.interface';
import type { IControlTasksRepository } from '../repositories/control-task-repository.interface';
import { validateRoute } from './validate-route';

@Injectable()
export class UpdateControlTaskUseCase {
  constructor(
    @Inject(CONTROL_TASKS_REPOSITORY)
    private readonly controlTasksRepository: IControlTasksRepository,
  ) {}

  async execute(id: string, dto: UpdateControlTaskDto) {
    const existing = await this.controlTasksRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Control Task not found');
    }

    if (dto.abjad && dto.abjad !== existing.abjad) {
      const abjadTaken = await this.controlTasksRepository.existsByAbjad(
        dto.abjad,
        id,
      );
      if (abjadTaken) {
        throw new BadRequestException('Abjad already in use');
      }
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.controlTasksRepository.existsByName(
        dto.name,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException('Control Task name already in use');
      }
    }

    if (
      dto.modelCodeProcessId &&
      dto.modelCodeProcessId !== existing.modelCodeProcessId
    ) {
      const modelExists =
        await this.controlTasksRepository.modelCodeProcessExists(
          dto.modelCodeProcessId,
        );
      if (!modelExists) {
        throw new BadRequestException('Model Code Process not found');
      }
    }

    const route = dto.route
      ? await validateRoute(this.controlTasksRepository, dto.route)
      : undefined;

    try {
      const updated = await this.controlTasksRepository.update(id, {
        ...dto,
        ...(route ? { route } : {}),
      });
      return toControlTaskResponse(updated);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'A Control Task with this abjad or name is already in use',
        );
      }
      throw error;
    }
  }
}
