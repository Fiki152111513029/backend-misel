import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ROLES_REPOSITORY } from '../repositories/roles-repository.interface';
import type { IRolesRepository } from '../repositories/roles-repository.interface';

@Injectable()
export class FindOneRoleUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,
  ) {}

  async execute(id: string) {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }
}
