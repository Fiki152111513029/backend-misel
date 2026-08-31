import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateParkingAreaDto } from '../dto/create-parking-area.dto';
import { PARKING_AREAS_REPOSITORY } from '../repositories/parking-area-repository.interface';
import type { IParkingAreasRepository } from '../repositories/parking-area-repository.interface';

@Injectable()
export class CreateParkingAreaUseCase {
  constructor(
    @Inject(PARKING_AREAS_REPOSITORY)
    private readonly parkingAreasRepository: IParkingAreasRepository,
  ) {}

  async execute(dto: CreateParkingAreaDto) {
    const nameTaken = await this.parkingAreasRepository.existsByName(dto.name);
    if (nameTaken) {
      throw new BadRequestException('Parking Area name already in use');
    }

    const codeTaken = await this.parkingAreasRepository.existsByLocationCode(
      dto.iRaypleLocationCode,
    );
    if (codeTaken) {
      throw new BadRequestException('iRayple Location Code already in use');
    }

    try {
      return await this.parkingAreasRepository.create(dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'A Parking Area with this name or code is already in use',
        );
      }
      throw error;
    }
  }
}
