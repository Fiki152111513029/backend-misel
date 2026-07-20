import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateQuarantineAreaDto } from '../dto/update-quarantine-area.dto';
import { QUARANTINE_AREAS_REPOSITORY } from '../repositories/quarantine-area-repository.interface';
import type { IQuarantineAreasRepository } from '../repositories/quarantine-area-repository.interface';

@Injectable()
export class UpdateQuarantineAreaUseCase {
  constructor(
    @Inject(QUARANTINE_AREAS_REPOSITORY)
    private readonly quarantineAreasRepository: IQuarantineAreasRepository,
  ) {}

  async execute(id: string, dto: UpdateQuarantineAreaDto) {
    const existing = await this.quarantineAreasRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Quarantine Area not found');
    }

    if (
      dto.iRaypleLocationCode &&
      dto.iRaypleLocationCode !== existing.iRaypleLocationCode
    ) {
      const codeTaken =
        await this.quarantineAreasRepository.existsByLocationCode(
          dto.iRaypleLocationCode,
          id,
        );
      if (codeTaken) {
        throw new BadRequestException('iRayple Location Code already in use');
      }
    }

    if (
      dto.quarantineLineId &&
      dto.quarantineLineId !== existing.quarantineLineId
    ) {
      const lineExists =
        await this.quarantineAreasRepository.existsActiveLineById(
          dto.quarantineLineId,
        );
      if (!lineExists) {
        throw new BadRequestException('Quarantine Line not found');
      }
    }

    return this.quarantineAreasRepository.update(id, dto);
  }
}
