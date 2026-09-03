import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { CreateShiftDto } from '../dto/create-shift.dto';
import { SHIFTS_REPOSITORY } from '../repositories/shift-repository.interface';
import type { IShiftsRepository } from '../repositories/shift-repository.interface';

@Injectable()
export class CreateShiftUseCase {
  constructor(
    @Inject(SHIFTS_REPOSITORY)
    private readonly shiftsRepository: IShiftsRepository,
  ) {}

  async execute(dto: CreateShiftDto) {
    const nameTaken = await this.shiftsRepository.existsByName(dto.name);
    if (nameTaken) {
      throw new BadRequestException('Shift name already in use');
    }

    try {
      return await this.shiftsRepository.create(dto);
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
