import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { USERS_REPOSITORY } from './repositories/users-repository.interface';
import { UsersRepository } from './repositories/users.repository';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { FindAllUsersUseCase } from './use-cases/find-all-users.use-case';
import { FindOneUserUseCase } from './use-cases/find-one-user.use-case';
import { RemoveUserUseCase } from './use-cases/remove-user.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';

@Module({
  controllers: [UsersController],
  providers: [
    { provide: USERS_REPOSITORY, useClass: UsersRepository },
    CreateUserUseCase,
    FindAllUsersUseCase,
    FindOneUserUseCase,
    UpdateUserUseCase,
    RemoveUserUseCase,
  ],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}
