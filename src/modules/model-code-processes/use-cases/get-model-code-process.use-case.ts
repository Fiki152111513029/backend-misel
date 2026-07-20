import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MODEL_CODE_PROCESSES_REPOSITORY } from '../repositories/model-code-process-repository.interface';
import type { IModelCodeProcessesRepository } from '../repositories/model-code-process-repository.interface';

@Injectable()
export class GetModelCodeProcessUseCase {
  constructor(
    @Inject(MODEL_CODE_PROCESSES_REPOSITORY)
    private readonly modelCodeProcessesRepository: IModelCodeProcessesRepository,
  ) {}

  async execute(id: string) {
    const modelCodeProcess =
      await this.modelCodeProcessesRepository.findById(id);
    if (!modelCodeProcess) {
      throw new NotFoundException('Model Code Process not found');
    }
    return modelCodeProcess;
  }
}
