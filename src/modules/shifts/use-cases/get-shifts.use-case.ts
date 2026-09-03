import { Inject, Injectable } from '@nestjs/common';
import { ShiftQueryDto } from '../dto/shift-query.dto';
import { SHIFTS_REPOSITORY } from '../repositories/shift-repository.interface';
import type { IShiftsRepository } from '../repositories/shift-repository.interface';

@Injectable()
export class GetShiftsUseCase {
  constructor(
    @Inject(SHIFTS_REPOSITORY)
    private readonly shiftsRepository: IShiftsRepository,
  ) {}

  async execute(query: ShiftQueryDto) {
    const { items, total } = await this.shiftsRepository.findAll(query);

    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
