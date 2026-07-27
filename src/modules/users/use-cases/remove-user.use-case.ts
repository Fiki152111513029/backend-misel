import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USERS_REPOSITORY } from '../repositories/users-repository.interface';
import type { IUsersRepository } from '../repositories/users-repository.interface';

@Injectable()
export class RemoveUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    // Soft-deletes the user and cascades a soft-delete to their tasks,
    // production line, and warehouse assignments — see
    // UsersRepository.remove for why this is never a hard DB delete.
    await this.usersRepository.remove(id);
  }
}
