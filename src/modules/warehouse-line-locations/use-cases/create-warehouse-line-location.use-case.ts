import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateWarehouseLineLocationDto } from '../dto/create-warehouse-line-location.dto';
import { WAREHOUSE_LINE_LOCATIONS_REPOSITORY } from '../repositories/warehouse-line-location-repository.interface';
import type { IWarehouseLineLocationsRepository } from '../repositories/warehouse-line-location-repository.interface';
import { MODEL_CODE_PROCESSES_REPOSITORY } from '../../model-code-processes/repositories/model-code-process-repository.interface';
import type { IModelCodeProcessesRepository } from '../../model-code-processes/repositories/model-code-process-repository.interface';
import { WAREHOUSE_LOCATIONS_REPOSITORY } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import type { IWarehouseLocationsRepository } from '../../warehouse-locations/repositories/warehouse-location-repository.interface';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../../production-locations/repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../../production-locations/repositories/production-location-repository.interface';

@Injectable()
export class CreateWarehouseLineLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_LINE_LOCATIONS_REPOSITORY)
    private readonly warehouseLineLocationsRepository: IWarehouseLineLocationsRepository,
    @Inject(MODEL_CODE_PROCESSES_REPOSITORY)
    private readonly modelCodeProcessesRepository: IModelCodeProcessesRepository,
    @Inject(WAREHOUSE_LOCATIONS_REPOSITORY)
    private readonly warehouseLocationsRepository: IWarehouseLocationsRepository,
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
  ) {}

  private async existsAsRealLocationCode(code: string): Promise<boolean> {
    const [inWarehouse, inProduction] = await Promise.all([
      this.warehouseLocationsRepository.existsActiveByLocationCode(code),
      this.productionLocationsRepository.existsActiveByLocationCode(code),
    ]);
    return inWarehouse || inProduction;
  }

  async execute(dto: CreateWarehouseLineLocationDto) {
    const nameTaken = await this.warehouseLineLocationsRepository.existsByName(
      dto.name,
    );
    if (nameTaken) {
      throw new BadRequestException(
        'Warehouse Line Location name already in use',
      );
    }

    const droppingTaken =
      await this.warehouseLineLocationsRepository.existsByDroppingLocationCode(
        dto.droppingLocationCode,
      );
    if (droppingTaken) {
      throw new BadRequestException('Dropping Location Code already in use');
    }

    const pickingTaken =
      await this.warehouseLineLocationsRepository.existsByPickingLocationCode(
        dto.pickingLocationCode,
      );
    if (pickingTaken) {
      throw new BadRequestException('Picking Location Code already in use');
    }

    if (!(await this.existsAsRealLocationCode(dto.droppingLocationCode))) {
      throw new BadRequestException(
        'Dropping Location Code must match an active Warehouse Location or Production Location',
      );
    }

    if (!(await this.existsAsRealLocationCode(dto.pickingLocationCode))) {
      throw new BadRequestException(
        'Picking Location Code must match an active Warehouse Location or Production Location',
      );
    }

    if (dto.modelCodeProcessId) {
      const modelCodeProcess = await this.modelCodeProcessesRepository.findById(
        dto.modelCodeProcessId,
      );
      if (!modelCodeProcess || !modelCodeProcess.isActive) {
        throw new BadRequestException('Model Code Process not found');
      }
    }

    try {
      return await this.warehouseLineLocationsRepository.create(dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'A Warehouse Line Location with this name or code is already in use',
        );
      }
      throw error;
    }
  }
}
