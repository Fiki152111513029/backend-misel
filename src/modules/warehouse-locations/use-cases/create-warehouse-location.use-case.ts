import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateWarehouseLocationDto } from '../dto/create-warehouse-location.dto';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../repositories/warehouse-location-repository.interface';

@Injectable()
export class CreateWarehouseLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
  ) {}

  async execute(dto: CreateWarehouseLocationDto) {
    const nameTaken = await this.warehouseLocationsRepository.existsByName(
      dto.name,
    );
    if (nameTaken) {
      throw new BadRequestException('Warehouse Location name already in use');
    }

    const codeTaken =
      await this.warehouseLocationsRepository.existsByLocationCode(
        dto.iRaypleLocationCode,
      );
    if (codeTaken) {
      throw new BadRequestException('iRayple Location Code already in use');
    }

    try {
      return await this.warehouseLocationsRepository.create(dto);
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
