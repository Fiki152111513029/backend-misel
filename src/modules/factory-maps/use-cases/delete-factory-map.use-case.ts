import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  FACTORY_MAPS_REPOSITORY,
  type IFactoryMapsRepository,
} from '../repositories/factory-map-repository.interface';

@Injectable()
export class DeleteFactoryMapUseCase {
  constructor(
    @Inject(FACTORY_MAPS_REPOSITORY)
    private readonly factoryMapsRepository: IFactoryMapsRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.factoryMapsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Factory Map not found');
    }

    // Soft delete only — files stay on disk, same recoverability as every
    // other soft-deleted entity in this app.
    await this.factoryMapsRepository.softDelete(id);
  }
}
