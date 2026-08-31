import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PARKING_AREAS_REPOSITORY } from '../repositories/parking-area-repository.interface';
import type { IParkingAreasRepository } from '../repositories/parking-area-repository.interface';

@Injectable()
export class DeleteParkingAreaUseCase {
  constructor(
    @Inject(PARKING_AREAS_REPOSITORY)
    private readonly parkingAreasRepository: IParkingAreasRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.parkingAreasRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Parking Area not found');
    }

    await this.parkingAreasRepository.softDelete(id);
  }
}
