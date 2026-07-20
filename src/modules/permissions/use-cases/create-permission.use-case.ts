import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { PERMISSIONS_REPOSITORY } from '../repositories/permissions-repository.interface';
import type { IPermissionsRepository } from '../repositories/permissions-repository.interface';

@Injectable()
export class CreatePermissionUseCase {
  constructor(
    @Inject(PERMISSIONS_REPOSITORY)
    private readonly permissionsRepository: IPermissionsRepository,
  ) {}

  async execute(dto: CreatePermissionDto) {
    const exists = await this.permissionsRepository.existsByCode(dto.code);
    if (exists) {
      throw new ConflictException('Permission code already in use');
    }
    return this.permissionsRepository.create(dto);
  }
}
