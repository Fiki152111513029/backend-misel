import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateQuarantineAreaDto } from '../dto/create-quarantine-area.dto';
import { QUARANTINE_AREAS_REPOSITORY } from '../repositories/quarantine-area-repository.interface';
import type { IQuarantineAreasRepository } from '../repositories/quarantine-area-repository.interface';

@Injectable()
export class CreateQuarantineAreaUseCase {
  constructor(
    @Inject(QUARANTINE_AREAS_REPOSITORY)
    private readonly quarantineAreasRepository: IQuarantineAreasRepository,
  ) {}

  async execute(dto: CreateQuarantineAreaDto) {
    const codeTaken = await this.quarantineAreasRepository.existsByLocationCode(
      dto.iRaypleLocationCode,
    );
    if (codeTaken) {
      throw new BadRequestException('iRayple Location Code already in use');
    }

    const lineExists =
      await this.quarantineAreasRepository.existsActiveLineById(
        dto.quarantineLineId,
      );
    if (!lineExists) {
      throw new BadRequestException('Quarantine Line not found');
    }

    return this.quarantineAreasRepository.create(dto);
  }
}
