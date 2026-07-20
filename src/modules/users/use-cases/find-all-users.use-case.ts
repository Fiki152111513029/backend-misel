import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY } from '../repositories/users-repository.interface';
import type { IUsersRepository } from '../repositories/users-repository.interface';

@Injectable()
export class FindAllUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  execute() {
    return this.usersRepository.findAll();
  }
}
