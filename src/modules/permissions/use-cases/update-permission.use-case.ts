import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { PERMISSIONS_REPOSITORY } from '../repositories/permissions-repository.interface';
import type { IPermissionsRepository } from '../repositories/permissions-repository.interface';

@Injectable()
export class UpdatePermissionUseCase {
  constructor(
    @Inject(PERMISSIONS_REPOSITORY)
    private readonly permissionsRepository: IPermissionsRepository,
  ) {}

  async execute(id: string, dto: UpdatePermissionDto) {
    const existing = await this.permissionsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Permission not found');
    }

    if (dto.code && dto.code !== existing.code) {
      const codeTaken = await this.permissionsRepository.existsByCode(dto.code);
      if (codeTaken) {
        throw new ConflictException('Permission code already in use');
      }
    }

    return this.permissionsRepository.update(id, dto);
  }
}
