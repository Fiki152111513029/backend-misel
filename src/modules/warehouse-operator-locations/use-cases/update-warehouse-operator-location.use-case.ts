import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateWarehouseOperatorLocationDto } from '../dto/update-warehouse-operator-location.dto';
import { WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY } from '../repositories/warehouse-operator-location-repository.interface';
import type { IWarehouseOperatorLocationsRepository } from '../repositories/warehouse-operator-location-repository.interface';

@Injectable()
export class UpdateWarehouseOperatorLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_OPERATOR_LOCATIONS_REPOSITORY)
    private readonly warehouseOperatorLocationsRepository: IWarehouseOperatorLocationsRepository,
  ) {}

  async execute(id: string, dto: UpdateWarehouseOperatorLocationDto) {
    const existing =
      await this.warehouseOperatorLocationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Warehouse Operator Location not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken =
        await this.warehouseOperatorLocationsRepository.existsByName(
          dto.name,
          id,
        );
      if (nameTaken) {
        throw new BadRequestException(
          'Warehouse Operator Location name already in use',
        );
      }
    }

    if (dto.locationCode && dto.locationCode !== existing.locationCode) {
      const codeTaken =
        await this.warehouseOperatorLocationsRepository.existsByLocationCode(
          dto.locationCode,
          id,
        );
      if (codeTaken) {
        throw new BadRequestException('Location Code already in use');
      }
    }

    if (dto.operatorId && dto.operatorId !== existing.operatorId) {
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
          id,
        );
      if (operatorTaken) {
        throw new BadRequestException(
          'This operator is already assigned to another warehouse location',
        );
      }
    }

    return this.warehouseOperatorLocationsRepository.update(id, dto);
  }
}
