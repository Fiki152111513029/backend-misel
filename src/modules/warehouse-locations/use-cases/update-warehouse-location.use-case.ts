import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { UpdateWarehouseLocationDto } from '../dto/update-warehouse-location.dto';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../repositories/warehouse-location-repository.interface';

@Injectable()
export class UpdateWarehouseLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
  ) {}

  async execute(id: string, dto: UpdateWarehouseLocationDto) {
    const existing = await this.warehouseLocationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Warehouse Location not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.warehouseLocationsRepository.existsByName(
        dto.name,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException('Warehouse Location name already in use');
      }
    }

    if (
      dto.iRaypleLocationCode &&
      dto.iRaypleLocationCode !== existing.iRaypleLocationCode
    ) {
      const codeTaken =
        await this.warehouseLocationsRepository.existsByLocationCode(
          dto.iRaypleLocationCode,
          id,
        );
      if (codeTaken) {
        throw new BadRequestException('iRayple Location Code already in use');
      }
    }

    try {
      return await this.warehouseLocationsRepository.update(id, dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'A Warehouse Location with this name or code is already in use',
        );
      }
      throw error;
    }
  }
}
