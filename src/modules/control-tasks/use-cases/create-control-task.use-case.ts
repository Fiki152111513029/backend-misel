import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateControlTaskDto } from '../dto/create-control-task.dto';
import { toControlTaskResponse } from '../entities/control-task.entity';
import { CONTROL_TASKS_REPOSITORY } from '../repositories/control-task-repository.interface';
import type { IControlTasksRepository } from '../repositories/control-task-repository.interface';
import { validateRoute } from './validate-route';

@Injectable()
export class CreateControlTaskUseCase {
  constructor(
    @Inject(CONTROL_TASKS_REPOSITORY)
    private readonly controlTasksRepository: IControlTasksRepository,
  ) {}

  async execute(dto: CreateControlTaskDto) {
    const abjadTaken = await this.controlTasksRepository.existsByAbjad(
      dto.abjad,
    );
    if (abjadTaken) {
      throw new BadRequestException('Abjad already in use');
    }

    const nameTaken = await this.controlTasksRepository.existsByName(dto.name);
    if (nameTaken) {
      throw new BadRequestException('Control Task name already in use');
    }

    const modelExists =
      await this.controlTasksRepository.modelCodeProcessExists(
        dto.modelCodeProcessId,
      );
    if (!modelExists) {
      throw new BadRequestException('Model Code Process not found');
    }

    const route = await validateRoute(this.controlTasksRepository, dto.route);

    try {
      const created = await this.controlTasksRepository.create({
        ...dto,
        route,
      });
      return toControlTaskResponse(created);
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
