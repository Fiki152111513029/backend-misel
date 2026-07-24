import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

    try {
      await this.usersRepository.remove(id);
    } catch (error) {
      // FK constraint: user is still referenced by tasks, production lines,
      // or warehouse assignments — deleting would orphan that history, so
      // surface a clear reason instead of a generic 500. The DB enforces
      // this as an explicit RESTRICT constraint, which Prisma surfaces as
      // PrismaClientUnknownRequestError (no .code) rather than the "known"
      // P2003 — verified empirically against the actual constraint error.
      const isForeignKeyRestriction =
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2003') ||
        (error instanceof Prisma.PrismaClientUnknownRequestError &&
          /foreign key constraint/i.test(error.message));

      if (isForeignKeyRestriction) {
        throw new ConflictException(
          'Cannot delete this user: they still have related records (tasks, production lines, or warehouse assignments). Deactivate the user instead.',
        );
      }
      throw error;
    }
  }
}
