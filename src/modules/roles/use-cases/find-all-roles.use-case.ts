import { Inject, Injectable } from '@nestjs/common';
import { ROLES_REPOSITORY } from '../repositories/roles-repository.interface';
import type { IRolesRepository } from '../repositories/roles-repository.interface';

@Injectable()
export class FindAllRolesUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: IRolesRepository,
  ) {}

  execute() {
    return this.rolesRepository.findAll();
  }
}
