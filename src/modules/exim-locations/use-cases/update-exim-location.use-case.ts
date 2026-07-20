import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateEximLocationDto } from '../dto/update-exim-location.dto';
import { EXIM_LOCATIONS_REPOSITORY } from '../repositories/exim-location-repository.interface';
import type { IEximLocationsRepository } from '../repositories/exim-location-repository.interface';

@Injectable()
export class UpdateEximLocationUseCase {
  constructor(
    @Inject(EXIM_LOCATIONS_REPOSITORY)
    private readonly eximLocationsRepository: IEximLocationsRepository,
  ) {}

  async execute(id: string, dto: UpdateEximLocationDto) {
    const existing = await this.eximLocationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('EXIM Location not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.eximLocationsRepository.existsByName(
        dto.name,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException('EXIM Location name already in use');
      }
    }

    if (
      dto.iRaypleLocationCode &&
      dto.iRaypleLocationCode !== existing.iRaypleLocationCode
    ) {
      const codeTaken = await this.eximLocationsRepository.existsByLocationCode(
        dto.iRaypleLocationCode,
        id,
      );
      if (codeTaken) {
        throw new BadRequestException('iRayple Location Code already in use');
      }
    }

    return this.eximLocationsRepository.update(id, dto);
  }
}
