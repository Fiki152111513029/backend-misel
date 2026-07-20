import { Module } from '@nestjs/common';
import { PermissionsController } from './controllers/permissions.controller';
import { PERMISSIONS_REPOSITORY } from './repositories/permissions-repository.interface';
import { PermissionsRepository } from './repositories/permissions.repository';
import { CreatePermissionUseCase } from './use-cases/create-permission.use-case';
import { FindAllPermissionsUseCase } from './use-cases/find-all-permissions.use-case';
import { FindOnePermissionUseCase } from './use-cases/find-one-permission.use-case';
import { RemovePermissionUseCase } from './use-cases/remove-permission.use-case';
import { UpdatePermissionUseCase } from './use-cases/update-permission.use-case';

@Module({
  controllers: [PermissionsController],
  providers: [
    { provide: PERMISSIONS_REPOSITORY, useClass: PermissionsRepository },
    CreatePermissionUseCase,
    FindAllPermissionsUseCase,
    FindOnePermissionUseCase,
    UpdatePermissionUseCase,
    RemovePermissionUseCase,
  ],
  exports: [PERMISSIONS_REPOSITORY],
})
export class PermissionsModule {}
