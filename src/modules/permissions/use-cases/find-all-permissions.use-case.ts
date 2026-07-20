import { Inject, Injectable } from '@nestjs/common';
import { PERMISSIONS_REPOSITORY } from '../repositories/permissions-repository.interface';
import type { IPermissionsRepository } from '../repositories/permissions-repository.interface';

@Injectable()
export class FindAllPermissionsUseCase {
  constructor(
    @Inject(PERMISSIONS_REPOSITORY)
    private readonly permissionsRepository: IPermissionsRepository,
  ) {}

  execute() {
    return this.permissionsRepository.findAll();
  }
}
