import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { QUARANTINE_AREAS_REPOSITORY } from '../repositories/quarantine-area-repository.interface';
import type { IQuarantineAreasRepository } from '../repositories/quarantine-area-repository.interface';

@Injectable()
export class GetQuarantineAreaUseCase {
  constructor(
    @Inject(QUARANTINE_AREAS_REPOSITORY)
    private readonly quarantineAreasRepository: IQuarantineAreasRepository,
  ) {}

  async execute(id: string) {
    const quarantineArea = await this.quarantineAreasRepository.findById(id);
    if (!quarantineArea) {
      throw new NotFoundException('Quarantine Area not found');
    }
    return quarantineArea;
  }
}
