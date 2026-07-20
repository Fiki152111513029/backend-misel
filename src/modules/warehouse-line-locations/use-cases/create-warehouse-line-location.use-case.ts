import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateWarehouseLineLocationDto } from '../dto/create-warehouse-line-location.dto';
import { WAREHOUSE_LINE_LOCATIONS_REPOSITORY } from '../repositories/warehouse-line-location-repository.interface';
import type { IWarehouseLineLocationsRepository } from '../repositories/warehouse-line-location-repository.interface';
import { MODEL_CODE_PROCESSES_REPOSITORY } from '../../model-code-processes/repositories/model-code-process-repository.interface';
import type { IModelCodeProcessesRepository } from '../../model-code-processes/repositories/model-code-process-repository.interface';

@Injectable()
export class CreateWarehouseLineLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_LINE_LOCATIONS_REPOSITORY)
    private readonly warehouseLineLocationsRepository: IWarehouseLineLocationsRepository,
    @Inject(MODEL_CODE_PROCESSES_REPOSITORY)
    private readonly modelCodeProcessesRepository: IModelCodeProcessesRepository,
  ) {}

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

    if (dto.modelCodeProcessId) {
      const modelCodeProcess = await this.modelCodeProcessesRepository.findById(
        dto.modelCodeProcessId,
      );
      if (!modelCodeProcess || !modelCodeProcess.isActive) {
        throw new BadRequestException('Model Code Process not found');
      }
    }

    return this.warehouseLineLocationsRepository.create(dto);
  }
}
