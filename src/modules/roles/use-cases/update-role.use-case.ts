import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { ROLES_REPOSITORY } from '../repositories/roles-repository.interface';
import type { IRolesRepository } from '../repositories/roles-repository.interface';

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,
  ) {}

  async execute(id: string, dto: UpdateRoleDto) {
    const existing = await this.rolesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.rolesRepository.existsByName(dto.name);
      if (nameTaken) {
        throw new ConflictException('Role name already in use');
      }
    }

    return this.rolesRepository.update(id, dto);
  }
}
