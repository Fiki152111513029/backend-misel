import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { UpdateTrolleyDto } from '../dto/update-trolley.dto';
import { TROLLEYS_REPOSITORY } from '../repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../repositories/trolley-repository.interface';
import { PRODUCTION_LOCATIONS_REPOSITORY } from '../../production-locations/repositories/production-location-repository.interface';
import type { IProductionLocationsRepository } from '../../production-locations/repositories/production-location-repository.interface';

@Injectable()
export class UpdateTrolleyUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
    @Inject(PRODUCTION_LOCATIONS_REPOSITORY)
    private readonly productionLocationsRepository: IProductionLocationsRepository,
  ) {}

  async execute(id: string, dto: UpdateTrolleyDto) {
    const existing = await this.trolleysRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Trolley not found');
    }

    if (dto.trolleyTypeId && dto.trolleyTypeId !== existing.trolleyTypeId) {
      const typeExists =
        await this.trolleysRepository.existsActiveTrolleyTypeById(
          dto.trolleyTypeId,
        );
      if (!typeExists) {
        throw new BadRequestException('Trolley Type not found');
      }
    }

    // name/code uniqueness is scoped to (name|code, trolleyTypeId), so a
    // conflict can appear either from changing the name/code itself, or
    // from moving this trolley into a Type that already has a matching one.
    const effectiveTrolleyTypeId = dto.trolleyTypeId ?? existing.trolleyTypeId;
    const typeChanging =
      dto.trolleyTypeId !== undefined &&
      dto.trolleyTypeId !== existing.trolleyTypeId;

    const nameChanging = dto.name !== undefined && dto.name !== existing.name;
    if (nameChanging || typeChanging) {
      const nameTaken = await this.trolleysRepository.existsByName(
        dto.name ?? existing.name,
        effectiveTrolleyTypeId,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException(
          'Trolley name already in use for this Type',
        );
      }
    }

    const codeChanging = dto.code !== undefined && dto.code !== existing.code;
    if (codeChanging || typeChanging) {
      const codeTaken = await this.trolleysRepository.existsByCode(
        dto.code ?? existing.code,
        effectiveTrolleyTypeId,
        id,
      );
      if (codeTaken) {
        throw new BadRequestException(
          'Trolley code already in use for this Type',
        );
      }
    }

    if (
      dto.trolleyCategoryId &&
      dto.trolleyCategoryId !== existing.trolleyCategoryId
    ) {
      const categoryExists =
        await this.trolleysRepository.existsActiveTrolleyCategoryById(
          dto.trolleyCategoryId,
        );
      if (!categoryExists) {
        throw new BadRequestException('Trolley Category not found');
      }
    }

    if (
      dto.droppingLocationCode &&
      dto.droppingLocationCode !== existing.droppingLocationCode
    ) {
      const locationExists =
        await this.productionLocationsRepository.existsActiveByLocationCode(
          dto.droppingLocationCode,
        );
      if (!locationExists) {
        throw new BadRequestException(
          'Dropping Location Code must match an active Production Location',
        );
      }
    }

    if (
      dto.modelCodeProcessId &&
      dto.modelCodeProcessId !== existing.modelCodeProcessId
    ) {
      const modelCodeProcessExists =
        await this.trolleysRepository.existsActiveModelCodeProcessById(
          dto.modelCodeProcessId,
        );
      if (!modelCodeProcessExists) {
        throw new BadRequestException('Model Code Process not found');
      }
    }

    if (dto.customerId && dto.customerId !== existing.customerId) {
      const customerExists =
        await this.trolleysRepository.existsActiveCustomerById(dto.customerId);
      if (!customerExists) {
        throw new BadRequestException('Customer not found');
      }
    }

    try {
      return await this.trolleysRepository.update(id, dto);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'A Trolley with this name or code already exists for this Type',
        );
      }
      throw error;
    }
  }
}
