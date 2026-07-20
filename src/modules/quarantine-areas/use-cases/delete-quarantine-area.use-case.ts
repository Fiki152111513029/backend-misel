import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { QUARANTINE_AREAS_REPOSITORY } from '../repositories/quarantine-area-repository.interface';
import type { IQuarantineAreasRepository } from '../repositories/quarantine-area-repository.interface';

@Injectable()
export class DeleteQuarantineAreaUseCase {
  constructor(
    @Inject(QUARANTINE_AREAS_REPOSITORY)
    private readonly quarantineAreasRepository: IQuarantineAreasRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.quarantineAreasRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Quarantine Area not found');
    }
    await this.quarantineAreasRepository.softDelete(id);
  }
}
