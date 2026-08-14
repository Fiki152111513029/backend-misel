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

@Injectable()
export class UpdateTrolleyUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
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
