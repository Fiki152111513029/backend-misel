import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { deleteUploadedFile } from '../utils/file-storage';
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

    // The DB row is still soft-deleted (same recoverability convention as
    // every other entity in this app), but the image/topology files are
    // real weight on disk and aren't needed once unlinked from a record —
    // unlike every other soft-deleted entity, keeping them around would
    // just accumulate unused storage, so they're actually removed here.
    await this.factoryMapsRepository.softDelete(id);
    deleteUploadedFile(existing.imagePath);
    deleteUploadedFile(existing.topologyPath);
  }
}
