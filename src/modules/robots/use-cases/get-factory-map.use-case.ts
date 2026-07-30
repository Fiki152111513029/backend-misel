import { Injectable } from '@nestjs/common';
import {
  FactoryMapData,
  FactoryMapService,
} from '../services/factory-map.service';

@Injectable()
export class GetFactoryMapUseCase {
  constructor(private readonly factoryMapService: FactoryMapService) {}

  execute(areaId?: number): Promise<FactoryMapData> {
    return this.factoryMapService.getFactoryMap(areaId);
  }
}
