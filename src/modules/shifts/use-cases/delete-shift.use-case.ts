import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SHIFTS_REPOSITORY } from '../repositories/shift-repository.interface';
import type { IShiftsRepository } from '../repositories/shift-repository.interface';

@Injectable()
export class DeleteShiftUseCase {
  constructor(
    @Inject(SHIFTS_REPOSITORY)
    private readonly shiftsRepository: IShiftsRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.shiftsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Shift not found');
    }

    await this.shiftsRepository.softDelete(id);
  }
}
