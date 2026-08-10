import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  FACTORY_MAPS_REPOSITORY,
  type IFactoryMapsRepository,
} from '../repositories/factory-map-repository.interface';

@Injectable()
export class GetFactoryMapUseCase {
  constructor(
    @Inject(FACTORY_MAPS_REPOSITORY)
    private readonly factoryMapsRepository: IFactoryMapsRepository,
  ) {}

  async execute(id: string) {
    const factoryMap = await this.factoryMapsRepository.findById(id);
    if (!factoryMap) {
      throw new NotFoundException('Factory Map not found');
    }
    return factoryMap;
  }
}
