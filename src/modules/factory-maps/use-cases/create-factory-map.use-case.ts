import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import {
  FACTORY_MAPS_REPOSITORY,
  type IFactoryMapsRepository,
} from '../repositories/factory-map-repository.interface';

export interface CreateFactoryMapInput {
  name: string;
  areaNumber: number;
  imagePath?: string;
  topologyPath: string;
}

@Injectable()
export class CreateFactoryMapUseCase {
  constructor(
    @Inject(FACTORY_MAPS_REPOSITORY)
    private readonly factoryMapsRepository: IFactoryMapsRepository,
  ) {}

  async execute(input: CreateFactoryMapInput) {
    const nameTaken = await this.factoryMapsRepository.existsByName(
      input.name,
    );
    if (nameTaken) {
      throw new BadRequestException('Factory Map name already in use');
    }

    const areaNumberTaken = await this.factoryMapsRepository.existsByAreaNumber(
      input.areaNumber,
    );
    if (areaNumberTaken) {
      throw new BadRequestException('Area Number already in use');
    }

    try {
      return await this.factoryMapsRepository.create(input);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'Factory Map name or Area Number already in use',
        );
      }
      throw error;
    }
  }
}
