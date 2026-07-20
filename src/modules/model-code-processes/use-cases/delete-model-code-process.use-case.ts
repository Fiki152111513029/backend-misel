import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MODEL_CODE_PROCESSES_REPOSITORY } from '../repositories/model-code-process-repository.interface';
import type { IModelCodeProcessesRepository } from '../repositories/model-code-process-repository.interface';

@Injectable()
export class DeleteModelCodeProcessUseCase {
  constructor(
    @Inject(MODEL_CODE_PROCESSES_REPOSITORY)
    private readonly modelCodeProcessesRepository: IModelCodeProcessesRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.modelCodeProcessesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Model Code Process not found');
    }

    await this.modelCodeProcessesRepository.softDelete(id);
  }
}
