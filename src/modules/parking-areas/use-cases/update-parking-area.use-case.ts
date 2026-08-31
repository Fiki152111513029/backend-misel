import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { UpdateParkingAreaDto } from '../dto/update-parking-area.dto';
import { PARKING_AREAS_REPOSITORY } from '../repositories/parking-area-repository.interface';
import type { IParkingAreasRepository } from '../repositories/parking-area-repository.interface';

@Injectable()
export class UpdateParkingAreaUseCase {
  constructor(
    @Inject(PARKING_AREAS_REPOSITORY)
    private readonly parkingAreasRepository: IParkingAreasRepository,
  ) {}

  async execute(id: string, dto: UpdateParkingAreaDto) {
    const existing = await this.parkingAreasRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Parking Area not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.parkingAreasRepository.existsByName(
        dto.name,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException('Parking Area name already in use');
      }
    }

    if (
      dto.iRaypleLocationCode &&
      dto.iRaypleLocationCode !== existing.iRaypleLocationCode
    ) {
      const codeTaken = await this.parkingAreasRepository.existsByLocationCode(
        dto.iRaypleLocationCode,
        id,
      );
      if (codeTaken) {
        throw new BadRequestException('iRayple Location Code already in use');
      }
    }

    try {
      return await this.parkingAreasRepository.update(id, dto);
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
