import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EXIM_LOCATIONS_REPOSITORY } from '../repositories/exim-location-repository.interface';
import type { IEximLocationsRepository } from '../repositories/exim-location-repository.interface';

@Injectable()
export class DeleteEximLocationUseCase {
  constructor(
    @Inject(EXIM_LOCATIONS_REPOSITORY)
    private readonly eximLocationsRepository: IEximLocationsRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.eximLocationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('EXIM Location not found');
    }

    const hasActiveProductionLineAreas =
      await this.eximLocationsRepository.hasActiveProductionLineAreas(id);
    if (hasActiveProductionLineAreas) {
      throw new BadRequestException(
        'Cannot delete an EXIM Location that has Production Line Areas',
      );
    }

    await this.eximLocationsRepository.softDelete(id);
  }
}
