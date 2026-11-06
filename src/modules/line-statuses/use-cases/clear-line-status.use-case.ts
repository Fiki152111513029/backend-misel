import { Inject, Injectable } from '@nestjs/common';
import { RealtimeService } from '../../realtime/realtime.service';
import { LINE_STATUSES_REPOSITORY } from '../repositories/line-status-repository.interface';
import type { ILineStatusesRepository } from '../repositories/line-status-repository.interface';

/**
 * The warehouse has dealt with what a line was saying and clears it.
 *
 * Deleting the row rather than flagging it read: there is one row per line
 * and it means "this is what the line is saying right now", so once it has
 * been handled there is nothing left to say.
 */
@Injectable()
export class ClearLineStatusUseCase {
  constructor(
    @Inject(LINE_STATUSES_REPOSITORY)
    private readonly lineStatusesRepository: ILineStatusesRepository,
    private readonly realtime: RealtimeService,
  ) {}

  async execute(groupName: string) {
    await this.lineStatusesRepository.clear(groupName);
    this.realtime.publish('line-status');
    return { groupName };
  }
}
