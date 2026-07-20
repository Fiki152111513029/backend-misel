import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateEximLocationDto } from '../dto/create-exim-location.dto';
import { EXIM_LOCATIONS_REPOSITORY } from '../repositories/exim-location-repository.interface';
import type { IEximLocationsRepository } from '../repositories/exim-location-repository.interface';

@Injectable()
export class CreateEximLocationUseCase {
  constructor(
    @Inject(EXIM_LOCATIONS_REPOSITORY)
    private readonly eximLocationsRepository: IEximLocationsRepository,
  ) {}

  async execute(dto: CreateEximLocationDto) {
    const nameTaken = await this.eximLocationsRepository.existsByName(dto.name);
    if (nameTaken) {
      throw new BadRequestException('EXIM Location name already in use');
    }

    const codeTaken = await this.eximLocationsRepository.existsByLocationCode(
      dto.iRaypleLocationCode,
    );
    if (codeTaken) {
      throw new BadRequestException('iRayple Location Code already in use');
    }

    return this.eximLocationsRepository.create(dto);
  }
}
