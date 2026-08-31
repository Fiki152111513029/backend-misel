import { Inject, Injectable } from '@nestjs/common';
import { ParkingAreaQueryDto } from '../dto/parking-area-query.dto';
import { PARKING_AREAS_REPOSITORY } from '../repositories/parking-area-repository.interface';
import type { IParkingAreasRepository } from '../repositories/parking-area-repository.interface';

@Injectable()
export class GetParkingAreasUseCase {
  constructor(
    @Inject(PARKING_AREAS_REPOSITORY)
    private readonly parkingAreasRepository: IParkingAreasRepository,
  ) {}

  async execute(query: ParkingAreaQueryDto) {
    const { items, total } = await this.parkingAreasRepository.findAll(query);

    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
