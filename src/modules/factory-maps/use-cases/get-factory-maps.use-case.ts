import { Inject, Injectable } from '@nestjs/common';
import { FactoryMapQueryDto } from '../dto/factory-map-query.dto';
import {
  FACTORY_MAPS_REPOSITORY,
  type IFactoryMapsRepository,
} from '../repositories/factory-map-repository.interface';

@Injectable()
export class GetFactoryMapsUseCase {
  constructor(
    @Inject(FACTORY_MAPS_REPOSITORY)
    private readonly factoryMapsRepository: IFactoryMapsRepository,
  ) {}

  async execute(query: FactoryMapQueryDto) {
    const { items, total } = await this.factoryMapsRepository.findAll(query);

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
