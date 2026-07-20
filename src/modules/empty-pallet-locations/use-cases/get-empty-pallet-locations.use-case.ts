import { Inject, Injectable } from '@nestjs/common';
import { EmptyPalletLocationQueryDto } from '../dto/empty-pallet-location-query.dto';
import { EMPTY_PALLET_LOCATIONS_REPOSITORY } from '../repositories/empty-pallet-location-repository.interface';
import type { IEmptyPalletLocationsRepository } from '../repositories/empty-pallet-location-repository.interface';

@Injectable()
export class GetEmptyPalletLocationsUseCase {
  constructor(
    @Inject(EMPTY_PALLET_LOCATIONS_REPOSITORY)
    private readonly emptyPalletLocationsRepository: IEmptyPalletLocationsRepository,
  ) {}

  async execute(query: EmptyPalletLocationQueryDto) {
    const { items, total } =
      await this.emptyPalletLocationsRepository.findAll(query);

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
