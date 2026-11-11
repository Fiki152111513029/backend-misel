import { Inject, Injectable } from '@nestjs/common';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../repositories/production-location-repository.interface';

export interface BulkDeleteProductionLocationsResult {
  /** Rows this call actually soft-deleted. */
  deleted: number;
  /** Ids that matched nothing — already deleted, or never existed. */
  missing: number;
}

@Injectable()
export class BulkDeleteProductionLocationsUseCase {
  constructor(
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
  ) {}

  /**
   * Deletes what it can and reports the rest, rather than refusing the
   * whole batch over one stale id.
   *
   * A selection is made against a list that was loaded seconds or minutes
   * ago. By the time Delete is pressed another operator may have removed
   * one of them, and throwing there would mean the other twenty are not
   * deleted either — a worse outcome than saying "19 of 20".
   */
  async execute(ids: string[]): Promise<BulkDeleteProductionLocationsResult> {
    // The same id twice would be counted twice against the result below.
    const unique = [...new Set(ids)];
    const deleted = await this.productionLocationsRepository.softDeleteMany(unique);
    return { deleted, missing: unique.length - deleted };
  }
}
