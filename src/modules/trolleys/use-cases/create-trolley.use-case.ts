import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateTrolleyDto } from '../dto/create-trolley.dto';
import { TROLLEYS_REPOSITORY } from '../repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../repositories/trolley-repository.interface';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../../production-locations/repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../../production-locations/repositories/production-location-repository.interface';

@Injectable()
export class CreateTrolleyUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
  ) {}

  async execute(dto: CreateTrolleyDto) {
    const nameTaken = await this.trolleysRepository.existsByName(dto.name);
    if (nameTaken) {
      throw new BadRequestException('Trolley name already in use');
    }

    const codeTaken = await this.trolleysRepository.existsByCode(dto.code);
    if (codeTaken) {
      throw new BadRequestException('Trolley code already in use');
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

    if (dto.modelCodeProcessId) {
      const modelCodeProcessExists =
        await this.trolleysRepository.existsActiveModelCodeProcessById(
          dto.modelCodeProcessId,
        );
      if (!modelCodeProcessExists) {
        throw new BadRequestException('Model Code Process not found');
      }
    }

    try {
      return await this.trolleysRepository.create(dto);
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
