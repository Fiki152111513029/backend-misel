import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AssignPermissionsDto } from '../dto/assign-permissions.dto';
import { ROLES_REPOSITORY } from '../repositories/roles-repository.interface';
import type { IRolesRepository } from '../repositories/roles-repository.interface';

@Injectable()
export class AssignPermissionsUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,
  ) {}

  async execute(roleId: string, dto: AssignPermissionsDto) {
    const existing = await this.rolesRepository.findById(roleId);
    if (!existing) {
      throw new NotFoundException('Role not found');
    }
    await this.rolesRepository.setPermissions(roleId, dto.permissionIds);
    return this.rolesRepository.findById(roleId);
  }
}
