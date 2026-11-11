import { Inject, Injectable } from '@nestjs/common';
import { TROLLEYS_REPOSITORY } from '../repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../repositories/trolley-repository.interface';

export interface BulkDeleteTrolleysResult {
  /** Trolleys this call actually soft-deleted. */
  deleted: number;
  /** Ids that matched nothing - already deleted, or never existed. */
  missing: number;
}

@Injectable()
export class BulkDeleteTrolleysUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
  ) {}

  /**
   * Deletes what it can and reports the rest, rather than refusing the
   * whole batch over one stale id.
   *
   * A selection is made against a list that was loaded seconds or minutes
   * ago. By the time Delete is pressed another admin may have removed one
   * of them, and throwing there would mean the other twenty are not
   * deleted either - a worse outcome than saying "19 of 20".
   */
  async execute(ids: string[]): Promise<BulkDeleteTrolleysResult> {
    // The same id twice would be counted twice against the result below.
    const unique = [...new Set(ids)];
    const deleted = await this.trolleysRepository.softDeleteMany(unique);
    return { deleted, missing: unique.length - deleted };
  }
}
