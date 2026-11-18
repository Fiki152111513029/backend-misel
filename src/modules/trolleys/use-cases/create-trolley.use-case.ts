import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateTrolleyDto } from '../dto/create-trolley.dto';
import { TROLLEYS_REPOSITORY } from '../repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../repositories/trolley-repository.interface';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../../production-locations/repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../../production-locations/repositories/production-location-repository.interface';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';

@Injectable()
export class CreateTrolleyUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
  ) {}

  async execute(dto: CreateTrolleyDto) {
    const typeExists =
      await this.trolleysRepository.existsActiveTrolleyTypeById(
        dto.trolleyTypeId,
      );
    if (!typeExists) {
      throw new BadRequestException('Trolley Type not found');
    }

    const nameTaken = await this.trolleysRepository.existsByName(
      dto.name,
      dto.trolleyTypeId,
    );
    if (nameTaken) {
      throw new BadRequestException(
        'Trolley name already in use for this Type',
      );
    }

    const codeTaken = await this.trolleysRepository.existsByCode(
      dto.code,
      dto.trolleyTypeId,
    );
    if (codeTaken) {
      throw new BadRequestException(
        'Trolley code already in use for this Type',
      );
    }

    if (dto.trolleyCategoryId) {
      const categoryExists =
        await this.trolleysRepository.existsActiveTrolleyCategoryById(
          dto.trolleyCategoryId,
        );
      if (!categoryExists) {
        throw new BadRequestException('Trolley Category not found');
      }
    }

    if (dto.droppingLocationCode) {
      const locationExists =
        await this.productionLocationsRepository.existsActiveByLocationCode(
          dto.droppingLocationCode,
        );
      if (!locationExists) {
        throw new BadRequestException(
          'Dropping Location Code must match an active Production Location',
        );
      }
    }

    if (dto.transitLocationCode) {
      // Either kind of node. A stop on the way from the warehouse to
      // production can be registered as a Production Location or a
      // Warehouse one depending on how the floor was mapped, and refusing
      // one of them would just be a guess about their map.
      const isProduction =
        await this.productionLocationsRepository.existsActiveByLocationCode(
          dto.transitLocationCode,
        );
      const isWarehouse = isProduction
        ? false
        : await this.warehouseLocationsRepository.existsActiveByLocationCode(
            dto.transitLocationCode,
          );
      if (!isProduction && !isWarehouse) {
        throw new BadRequestException(
          'Transit Location Code must match an active Production Location or Warehouse Location',
        );
      }
    }

    if (dto.modelCodeProcessId) {
      const modelCodeProcessExists =
        await this.trolleysRepository.existsActiveModelCodeProcessById(
          dto.modelCodeProcessId,
        );
      if (!modelCodeProcessExists) {
        throw new BadRequestException('Model Code Process not found');
      }
    }

    if (dto.customerId) {
      const customerExists =
        await this.trolleysRepository.existsActiveCustomerById(dto.customerId);
      if (!customerExists) {
        throw new BadRequestException('Customer not found');
      }
    }

    try {
      return await this.trolleysRepository.create(dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'A Trolley with this name or code already exists for this Type',
        );
      }
      throw error;
    }
  }
}
