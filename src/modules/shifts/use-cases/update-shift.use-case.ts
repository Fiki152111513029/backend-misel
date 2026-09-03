import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { UpdateShiftDto } from '../dto/update-shift.dto';
import { SHIFTS_REPOSITORY } from '../repositories/shift-repository.interface';
import type { IShiftsRepository } from '../repositories/shift-repository.interface';

@Injectable()
export class UpdateShiftUseCase {
  constructor(
    @Inject(SHIFTS_REPOSITORY)
    private readonly shiftsRepository: IShiftsRepository,
  ) {}

  async execute(id: string, dto: UpdateShiftDto) {
    const existing = await this.shiftsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Shift not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.shiftsRepository.existsByName(dto.name, id);
      if (nameTaken) {
        throw new BadRequestException('Shift name already in use');
      }
    }

    try {
      return await this.shiftsRepository.update(id, dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'A Shift with this name is already in use',
        );
      }
      throw error;
    }
  }
}
