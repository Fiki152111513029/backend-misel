import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { UpdateProductionLineDto } from '../dto/update-production-line.dto';
import { PRODUCTION_LINES_REPOSITORY } from '../repositories/production-line-repository.interface';
import type { IProductionLinesRepository } from '../repositories/production-line-repository.interface';

@Injectable()
export class UpdateProductionLineUseCase {
  constructor(
    @Inject(PRODUCTION_LINES_REPOSITORY)
    private readonly productionLinesRepository: IProductionLinesRepository,
  ) {}

  async execute(id: string, dto: UpdateProductionLineDto) {
    const existing = await this.productionLinesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Production Line not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.productionLinesRepository.existsByName(
        dto.name,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException('Production Line name already in use');
      }
    }

    if (
      dto.quarantineLineId &&
      dto.quarantineLineId !== existing.quarantineLineId
    ) {
      const quarantineLineExists =
        await this.productionLinesRepository.existsActiveQuarantineLineById(
          dto.quarantineLineId,
        );
      if (!quarantineLineExists) {
        throw new BadRequestException('Quarantine Line not found');
      }
    }

    if (dto.operatorId && dto.operatorId !== existing.operatorId) {
      const operatorExists =
        await this.productionLinesRepository.existsActiveUserById(
          dto.operatorId,
        );
      if (!operatorExists) {
        throw new BadRequestException('Operator must be an active user');
      }
    }

    try {
      return await this.productionLinesRepository.update(id, dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException('Production Line name already in use');
      }
      throw error;
    }
  }
}
