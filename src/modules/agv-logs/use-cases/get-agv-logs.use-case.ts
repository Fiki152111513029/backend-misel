import { Inject, Injectable } from '@nestjs/common';
import { AGV_LOGS_REPOSITORY } from '../repositories/agv-log-repository.interface';
import type { IAgvLogsRepository } from '../repositories/agv-log-repository.interface';
import { AgvLogQueryDto } from '../dto/agv-log-query.dto';

@Injectable()
export class GetAgvLogsUseCase {
  constructor(
    @Inject(AGV_LOGS_REPOSITORY)
    private readonly agvLogsRepository: IAgvLogsRepository,
  ) {}

  async execute(query: AgvLogQueryDto) {
    const { items, total } = await this.agvLogsRepository.findAll(query);
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
