import { Module } from '@nestjs/common';
import { RolesController } from './controllers/roles.controller';
import { ROLES_REPOSITORY } from './repositories/roles-repository.interface';
import { RolesRepository } from './repositories/roles.repository';
import { AssignPermissionsUseCase } from './use-cases/assign-permissions.use-case';
import { CreateRoleUseCase } from './use-cases/create-role.use-case';
import { FindAllRolesUseCase } from './use-cases/find-all-roles.use-case';
import { FindOneRoleUseCase } from './use-cases/find-one-role.use-case';
import { RemoveRoleUseCase } from './use-cases/remove-role.use-case';
import { UpdateRoleUseCase } from './use-cases/update-role.use-case';

@Module({
  controllers: [RolesController],
  providers: [
    { provide: ROLES_REPOSITORY, useClass: RolesRepository },
    CreateRoleUseCase,
    FindAllRolesUseCase,
    FindOneRoleUseCase,
    UpdateRoleUseCase,
    RemoveRoleUseCase,
    AssignPermissionsUseCase,
  ],
  exports: [ROLES_REPOSITORY],
})
export class RolesModule {}
