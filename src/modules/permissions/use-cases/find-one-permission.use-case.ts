import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PERMISSIONS_REPOSITORY } from '../repositories/permissions-repository.interface';
import type { IPermissionsRepository } from '../repositories/permissions-repository.interface';

@Injectable()
export class FindOnePermissionUseCase {
  constructor(
    @Inject(PERMISSIONS_REPOSITORY)
    private readonly permissionsRepository: IPermissionsRepository,
  ) {}

  async execute(id: string) {
    const permission = await this.permissionsRepository.findById(id);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission;
  }
}
