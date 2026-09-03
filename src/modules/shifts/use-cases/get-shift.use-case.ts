import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SHIFTS_REPOSITORY } from '../repositories/shift-repository.interface';
import type { IShiftsRepository } from '../repositories/shift-repository.interface';

@Injectable()
export class GetShiftUseCase {
  constructor(
    @Inject(SHIFTS_REPOSITORY)
    private readonly shiftsRepository: IShiftsRepository,
  ) {}

  async execute(id: string) {
    const shift = await this.shiftsRepository.findById(id);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    return shift;
  }
}
