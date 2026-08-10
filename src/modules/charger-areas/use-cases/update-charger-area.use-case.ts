import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { UpdateChargerAreaDto } from '../dto/update-charger-area.dto';
import { CHARGER_AREAS_REPOSITORY } from '../repositories/charger-area-repository.interface';
import type { IChargerAreasRepository } from '../repositories/charger-area-repository.interface';

@Injectable()
export class UpdateChargerAreaUseCase {
  constructor(
    @Inject(CHARGER_AREAS_REPOSITORY)
    private readonly chargerAreasRepository: IChargerAreasRepository,
  ) {}

  async execute(id: string, dto: UpdateChargerAreaDto) {
    const existing = await this.chargerAreasRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Charger Area not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.chargerAreasRepository.existsByName(
        dto.name,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException('Charger Area name already in use');
      }
    }

    if (
      dto.iRaypleLocationCode &&
      dto.iRaypleLocationCode !== existing.iRaypleLocationCode
    ) {
      const codeTaken = await this.chargerAreasRepository.existsByLocationCode(
        dto.iRaypleLocationCode,
        id,
      );
      if (codeTaken) {
        throw new BadRequestException('iRayple Location Code already in use');
      }
    }

    try {
      return await this.chargerAreasRepository.update(id, dto);
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
