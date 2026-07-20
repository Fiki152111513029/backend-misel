import { Inject, Injectable } from '@nestjs/common';
import { QuarantineLineQueryDto } from '../dto/quarantine-line-query.dto';
import { QUARANTINE_LINES_REPOSITORY } from '../repositories/quarantine-line-repository.interface';
import type { IQuarantineLinesRepository } from '../repositories/quarantine-line-repository.interface';

@Injectable()
export class GetQuarantineLinesUseCase {
  constructor(
    @Inject(QUARANTINE_LINES_REPOSITORY)
    private readonly quarantineLinesRepository: IQuarantineLinesRepository,
  ) {}

  async execute(query: QuarantineLineQueryDto) {
    const { items, total } =
      await this.quarantineLinesRepository.findAll(query);

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
