import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateChargerAreaDto } from '../dto/create-charger-area.dto';
import { CHARGER_AREAS_REPOSITORY } from '../repositories/charger-area-repository.interface';
import type { IChargerAreasRepository } from '../repositories/charger-area-repository.interface';

@Injectable()
export class CreateChargerAreaUseCase {
  constructor(
    @Inject(CHARGER_AREAS_REPOSITORY)
    private readonly chargerAreasRepository: IChargerAreasRepository,
  ) {}

  async execute(dto: CreateChargerAreaDto) {
    const nameTaken = await this.chargerAreasRepository.existsByName(
      dto.name,
    );
    if (nameTaken) {
      throw new BadRequestException('Charger Area name already in use');
    }

    const codeTaken = await this.chargerAreasRepository.existsByLocationCode(
      dto.iRaypleLocationCode,
    );
    if (codeTaken) {
      throw new BadRequestException('iRayple Location Code already in use');
    }

    try {
      return await this.chargerAreasRepository.create(dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'A Charger Area with this name or code is already in use',
        );
      }
      throw error;
    }
  }
}
