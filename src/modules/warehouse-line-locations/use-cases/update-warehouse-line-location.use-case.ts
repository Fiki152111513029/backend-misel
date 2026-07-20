import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateWarehouseLineLocationDto } from '../dto/update-warehouse-line-location.dto';
import { WAREHOUSE_LINE_LOCATIONS_REPOSITORY } from '../repositories/warehouse-line-location-repository.interface';
import type { IWarehouseLineLocationsRepository } from '../repositories/warehouse-line-location-repository.interface';
import { MODEL_CODE_PROCESSES_REPOSITORY } from '../../model-code-processes/repositories/model-code-process-repository.interface';
import type { IModelCodeProcessesRepository } from '../../model-code-processes/repositories/model-code-process-repository.interface';

@Injectable()
export class UpdateWarehouseLineLocationUseCase {
  constructor(
    @Inject(WAREHOUSE_LINE_LOCATIONS_REPOSITORY)
    private readonly warehouseLineLocationsRepository: IWarehouseLineLocationsRepository,
    @Inject(MODEL_CODE_PROCESSES_REPOSITORY)
    private readonly modelCodeProcessesRepository: IModelCodeProcessesRepository,
  ) {}

  async execute(id: string, dto: UpdateWarehouseLineLocationDto) {
    const existing = await this.warehouseLineLocationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Warehouse Line Location not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken =
        await this.warehouseLineLocationsRepository.existsByName(dto.name, id);
      if (nameTaken) {
        throw new BadRequestException(
          'Warehouse Line Location name already in use',
        );
      }
    }

    if (
      dto.droppingLocationCode &&
      dto.droppingLocationCode !== existing.droppingLocationCode
    ) {
      const droppingTaken =
        await this.warehouseLineLocationsRepository.existsByDroppingLocationCode(
          dto.droppingLocationCode,
          id,
        );
      if (droppingTaken) {
        throw new BadRequestException('Dropping Location Code already in use');
      }
    }

    if (
      dto.pickingLocationCode &&
      dto.pickingLocationCode !== existing.pickingLocationCode
    ) {
      const pickingTaken =
        await this.warehouseLineLocationsRepository.existsByPickingLocationCode(
          dto.pickingLocationCode,
          id,
        );
      if (pickingTaken) {
        throw new BadRequestException('Picking Location Code already in use');
      }
    }

    if (
      dto.modelCodeProcessId &&
      dto.modelCodeProcessId !== existing.modelCodeProcessId
    ) {
      const modelCodeProcess = await this.modelCodeProcessesRepository.findById(
        dto.modelCodeProcessId,
      );
      if (!modelCodeProcess || !modelCodeProcess.isActive) {
        throw new BadRequestException('Model Code Process not found');
      }
    }

    return this.warehouseLineLocationsRepository.update(id, dto);
  }
}
