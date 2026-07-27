import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateProductionLineDto } from '../dto/create-production-line.dto';
import { PRODUCTION_LINES_REPOSITORY } from '../repositories/production-line-repository.interface';
import type { IProductionLinesRepository } from '../repositories/production-line-repository.interface';

@Injectable()
export class CreateProductionLineUseCase {
  constructor(
    @Inject(PRODUCTION_LINES_REPOSITORY)
    private readonly productionLinesRepository: IProductionLinesRepository,
  ) {}

  async execute(dto: CreateProductionLineDto) {
    const nameTaken = await this.productionLinesRepository.existsByName(
      dto.name,
    );
    if (nameTaken) {
      throw new BadRequestException('Production Line name already in use');
    }

    const quarantineLineExists =
      await this.productionLinesRepository.existsActiveQuarantineLineById(
        dto.quarantineLineId,
      );
    if (!quarantineLineExists) {
      throw new BadRequestException('Quarantine Line not found');
    }

    const operatorExists =
      await this.productionLinesRepository.existsActiveUserById(dto.operatorId);
    if (!operatorExists) {
      throw new BadRequestException('Operator must be an active user');
    }

    try {
      return await this.productionLinesRepository.create(dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException('Production Line name already in use');
      }
      throw error;
    }
  }
}
