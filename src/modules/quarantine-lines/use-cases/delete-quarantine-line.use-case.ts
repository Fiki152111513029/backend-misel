import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QUARANTINE_LINES_REPOSITORY } from '../repositories/quarantine-line-repository.interface';
import type { IQuarantineLinesRepository } from '../repositories/quarantine-line-repository.interface';

@Injectable()
export class DeleteQuarantineLineUseCase {
  constructor(
    @Inject(QUARANTINE_LINES_REPOSITORY)
    private readonly quarantineLinesRepository: IQuarantineLinesRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.quarantineLinesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Quarantine Line not found');
    }

    const hasActiveAreas =
      await this.quarantineLinesRepository.hasActiveAreas(id);
    if (hasActiveAreas) {
      throw new BadRequestException(
        'Cannot delete a Quarantine Line that has Quarantine Areas',
      );
    }

    const hasActiveProductionLines =
      await this.quarantineLinesRepository.hasActiveProductionLines(id);
    if (hasActiveProductionLines) {
      throw new BadRequestException(
        'Cannot delete a Quarantine Line that has Production Lines',
      );
    }

    await this.quarantineLinesRepository.softDelete(id);
  }
}
