import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { UpdateModelCodeProcessDto } from '../dto/update-model-code-process.dto';
import { MODEL_CODE_PROCESSES_REPOSITORY } from '../repositories/model-code-process-repository.interface';
import type { IModelCodeProcessesRepository } from '../repositories/model-code-process-repository.interface';

@Injectable()
export class UpdateModelCodeProcessUseCase {
  constructor(
    @Inject(MODEL_CODE_PROCESSES_REPOSITORY)
    private readonly modelCodeProcessesRepository: IModelCodeProcessesRepository,
  ) {}

  async execute(id: string, dto: UpdateModelCodeProcessDto) {
    const existing = await this.modelCodeProcessesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Model Code Process not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.modelCodeProcessesRepository.existsByName(
        dto.name,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException(
          'Model Code Process name already in use',
        );
      }
    }

    try {
      return await this.modelCodeProcessesRepository.update(id, dto);
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
