import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { deleteUploadedFile } from '../utils/file-storage';
import {
  FACTORY_MAPS_REPOSITORY,
  type IFactoryMapsRepository,
} from '../repositories/factory-map-repository.interface';

export interface UpdateFactoryMapInput {
  name?: string;
  areaNumber?: number;
  imagePath?: string;
  topologyPath?: string;
}

@Injectable()
export class UpdateFactoryMapUseCase {
  constructor(
    @Inject(FACTORY_MAPS_REPOSITORY)
    private readonly factoryMapsRepository: IFactoryMapsRepository,
  ) {}

  async execute(id: string, input: UpdateFactoryMapInput) {
    const existing = await this.factoryMapsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Factory Map not found');
    }

    if (input.name && input.name !== existing.name) {
      const nameTaken = await this.factoryMapsRepository.existsByName(
        input.name,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException('Factory Map name already in use');
      }
    }

    if (
      input.areaNumber !== undefined &&
      input.areaNumber !== existing.areaNumber
    ) {
      const areaNumberTaken =
        await this.factoryMapsRepository.existsByAreaNumber(
          input.areaNumber,
          id,
        );
      if (areaNumberTaken) {
        throw new BadRequestException('Area Number already in use');
      }
    }

    let updated;
    try {
      updated = await this.factoryMapsRepository.update(id, input);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'Factory Map name or Area Number already in use',
        );
      }
      throw error;
    }

    // Only remove the old files once the DB update actually succeeded.
    if (input.imagePath && input.imagePath !== existing.imagePath) {
      deleteUploadedFile(existing.imagePath);
    }
    if (input.topologyPath && input.topologyPath !== existing.topologyPath) {
      deleteUploadedFile(existing.topologyPath);
    }

    return updated;
  }
}
