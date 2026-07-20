import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { QUARANTINE_LINES_REPOSITORY } from '../repositories/quarantine-line-repository.interface';
import type { IQuarantineLinesRepository } from '../repositories/quarantine-line-repository.interface';

@Injectable()
export class GetQuarantineLineUseCase {
  constructor(
    @Inject(QUARANTINE_LINES_REPOSITORY)
    private readonly quarantineLinesRepository: IQuarantineLinesRepository,
  ) {}

  async execute(id: string) {
    const quarantineLine = await this.quarantineLinesRepository.findById(id);
    if (!quarantineLine) {
      throw new NotFoundException('Quarantine Line not found');
    }
    return quarantineLine;
  }
}
