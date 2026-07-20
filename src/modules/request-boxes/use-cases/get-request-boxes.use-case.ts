import { Inject, Injectable } from '@nestjs/common';
import { RequestBoxQueryDto } from '../dto/request-box-query.dto';
import { REQUEST_BOXES_REPOSITORY } from '../repositories/request-box-repository.interface';
import type { IRequestBoxesRepository } from '../repositories/request-box-repository.interface';

@Injectable()
export class GetRequestBoxesUseCase {
  constructor(
    @Inject(REQUEST_BOXES_REPOSITORY)
    private readonly requestBoxesRepository: IRequestBoxesRepository,
  ) {}

  async execute(query: RequestBoxQueryDto) {
    const { items, total } = await this.requestBoxesRepository.findAll(query);

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
