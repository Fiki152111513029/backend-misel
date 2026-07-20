import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateRoleDto } from '../dto/create-role.dto';
import { ROLES_REPOSITORY } from '../repositories/roles-repository.interface';
import type { IRolesRepository } from '../repositories/roles-repository.interface';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,
  ) {}

  async execute(dto: CreateRoleDto) {
    const exists = await this.rolesRepository.existsByName(dto.name);
    if (exists) {
      throw new ConflictException('Role name already in use');
    }
    return this.rolesRepository.create(dto);
  }
}
