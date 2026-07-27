import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateModelCodeProcessDto } from '../dto/create-model-code-process.dto';
import { MODEL_CODE_PROCESSES_REPOSITORY } from '../repositories/model-code-process-repository.interface';
import type { IModelCodeProcessesRepository } from '../repositories/model-code-process-repository.interface';

@Injectable()
export class CreateModelCodeProcessUseCase {
  constructor(
    @Inject(MODEL_CODE_PROCESSES_REPOSITORY)
    private readonly modelCodeProcessesRepository: IModelCodeProcessesRepository,
  ) {}

  async execute(dto: CreateModelCodeProcessDto) {
    const nameTaken = await this.modelCodeProcessesRepository.existsByName(
      dto.name,
    );
    if (nameTaken) {
      throw new BadRequestException('Model Code Process name already in use');
    }

    try {
      return await this.modelCodeProcessesRepository.create(dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'Model Code Process name already in use',
        );
      }
      throw error;
    }
  }
}
