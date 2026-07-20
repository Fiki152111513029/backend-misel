import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PERMISSIONS_REPOSITORY } from '../repositories/permissions-repository.interface';
import type { IPermissionsRepository } from '../repositories/permissions-repository.interface';

@Injectable()
export class RemovePermissionUseCase {
  constructor(
    @Inject(PERMISSIONS_REPOSITORY)
    private readonly permissionsRepository: IPermissionsRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.permissionsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Permission not found');
    }
    await this.permissionsRepository.remove(id);
  }
}
