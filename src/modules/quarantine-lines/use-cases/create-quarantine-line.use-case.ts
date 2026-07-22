import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateQuarantineLineDto } from '../dto/create-quarantine-line.dto';
import { QUARANTINE_LINES_REPOSITORY } from '../repositories/quarantine-line-repository.interface';
import type { IQuarantineLinesRepository } from '../repositories/quarantine-line-repository.interface';

@Injectable()
export class CreateQuarantineLineUseCase {
  constructor(
    @Inject(QUARANTINE_LINES_REPOSITORY)
    private readonly quarantineLinesRepository: IQuarantineLinesRepository,
  ) {}

  async execute(dto: CreateQuarantineLineDto) {
    const nameTaken = await this.quarantineLinesRepository.existsByName(
      dto.name,
    );
    if (nameTaken) {
      throw new BadRequestException('Quarantine Line name already in use');
    }

    if (dto.modelCodeProcessId) {
      const modelCodeProcessExists =
        await this.quarantineLinesRepository.existsActiveModelCodeProcessById(
          dto.modelCodeProcessId,
        );
      if (!modelCodeProcessExists) {
        throw new BadRequestException('Model Code Process not found');
      }
    }

    return this.quarantineLinesRepository.create(dto);
  }
}
