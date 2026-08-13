import { Inject, Injectable } from '@nestjs/common';
import { TrolleyQueryDto } from '../dto/trolley-query.dto';
import { TROLLEYS_REPOSITORY } from '../repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../repositories/trolley-repository.interface';

@Injectable()
export class GetTrolleysUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
  ) {}

  async execute(query: TrolleyQueryDto) {
    const { items, total } = await this.trolleysRepository.findAll(query);

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
