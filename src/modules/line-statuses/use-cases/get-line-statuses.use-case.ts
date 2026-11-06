import { Inject, Injectable } from '@nestjs/common';
import { LINE_STATUSES_REPOSITORY } from '../repositories/line-status-repository.interface';
import type { ILineStatusesRepository } from '../repositories/line-status-repository.interface';
import { toLineStatusResponse } from './to-line-status-response';

/**
 * What every line is currently saying, for the Checking Area board.
 *
 * Not scoped to the caller: the whole point is that the warehouse sees all
 * the lines at once, which is the opposite of the Custom Task picker.
 */
@Injectable()
export class GetLineStatusesUseCase {
  constructor(
    @Inject(LINE_STATUSES_REPOSITORY)
    private readonly lineStatusesRepository: ILineStatusesRepository,
  ) {}

  async execute() {
    const items = await this.lineStatusesRepository.findAll();
    return items.map(toLineStatusResponse);
  }
}
