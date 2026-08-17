import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { UpdateTrolleyDto } from '../dto/update-trolley.dto';
import { TROLLEYS_REPOSITORY } from '../repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../repositories/trolley-repository.interface';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../../production-locations/repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../../production-locations/repositories/production-location-repository.interface';

@Injectable()
export class UpdateTrolleyUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
  ) {}

  async execute(id: string, dto: UpdateTrolleyDto) {
    const existing = await this.trolleysRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Trolley not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.trolleysRepository.existsByName(dto.name, id);
      if (nameTaken) {
        throw new BadRequestException('Trolley name already in use');
      }
    }

    if (dto.code && dto.code !== existing.code) {
      const codeTaken = await this.trolleysRepository.existsByCode(dto.code, id);
      if (codeTaken) {
        throw new BadRequestException('Trolley code already in use');
      }
    }

    if (
      dto.trolleyCategoryId &&
      dto.trolleyCategoryId !== existing.trolleyCategoryId
    ) {
      const categoryExists =
        await this.trolleysRepository.existsActiveTrolleyCategoryById(
          dto.trolleyCategoryId,
        );
      if (!categoryExists) {
        throw new BadRequestException('Trolley Category not found');
      }
    }

    if (
      dto.droppingLocationCode &&
      dto.droppingLocationCode !== existing.droppingLocationCode
    ) {
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

    if (
      dto.modelCodeProcessId &&
      dto.modelCodeProcessId !== existing.modelCodeProcessId
    ) {
      const modelCodeProcessExists =
        await this.trolleysRepository.existsActiveModelCodeProcessById(
          dto.modelCodeProcessId,
        );
      if (!modelCodeProcessExists) {
        throw new BadRequestException('Model Code Process not found');
      }
    }

    try {
      return await this.trolleysRepository.update(id, dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'A Trolley with this name or code is already in use',
        );
      }
      throw error;
    }
  }
}
