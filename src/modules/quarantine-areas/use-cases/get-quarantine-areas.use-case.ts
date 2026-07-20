import { Inject, Injectable } from '@nestjs/common';
import { QuarantineAreaQueryDto } from '../dto/quarantine-area-query.dto';
import { QUARANTINE_AREAS_REPOSITORY } from '../repositories/quarantine-area-repository.interface';
import type { IQuarantineAreasRepository } from '../repositories/quarantine-area-repository.interface';

@Injectable()
export class GetQuarantineAreasUseCase {
  constructor(
    @Inject(QUARANTINE_AREAS_REPOSITORY)
    private readonly quarantineAreasRepository: IQuarantineAreasRepository,
  ) {}

  async execute(query: QuarantineAreaQueryDto) {
    const { items, total } =
      await this.quarantineAreasRepository.findAll(query);

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
