import { Inject, Injectable } from '@nestjs/common';
import { TrolleyActivityQueryDto } from '../dto/trolley-activity-query.dto';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';

@Injectable()
export class GetTrolleyActivitiesUseCase {
  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
  ) {}

  async execute(query: TrolleyActivityQueryDto) {
    const { items, total } = await this.trolleyActivitiesRepository.findAll(query);

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
