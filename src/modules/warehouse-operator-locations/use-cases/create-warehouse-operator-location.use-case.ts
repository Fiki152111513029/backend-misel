import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateWarehouseOperatorLocationDto } from '../dto/create-warehouse-operator-location.dto';
import { WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY } from '../repositories/warehouse-operator-location-repository.interface';
import type { IWarehouseOperatorLocationsRepository } from '../repositories/warehouse-operator-location-repository.interface';

@Injectable()
export class CreateWarehouseOperatorLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY)
    private readonly warehouseOperatorLocationsRepository: IWarehouseOperatorLocationsRepository,
  ) {}

  async execute(dto: CreateWarehouseOperatorLocationDto) {
    const nameTaken =
      await this.warehouseOperatorLocationsRepository.existsByName(dto.name);
    if (nameTaken) {
      throw new BadRequestException(
        'Warehouse Operator Location name already in use',
      );
    }

    const codeTaken =
      await this.warehouseOperatorLocationsRepository.existsByLocationCode(
        dto.locationCode,
      );
    if (codeTaken) {
      throw new BadRequestException('Location Code already in use');
    }

    const isWarehouseUser =
      await this.warehouseOperatorLocationsRepository.existsActiveWarehouseUserById(
        dto.operatorId,
      );
    if (!isWarehouseUser) {
      throw new BadRequestException(
        'Operator must be an active user with the Warehouse role',
      );
    }

    const operatorTaken =
      await this.warehouseOperatorLocationsRepository.existsByOperatorId(
        dto.operatorId,
      );
    if (operatorTaken) {
      throw new BadRequestException(
        'This operator is already assigned to another warehouse location',
      );
    }

    return this.warehouseOperatorLocationsRepository.create(dto);
  }
}
