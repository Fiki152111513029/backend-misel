import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserUseCase } from './create-user.use-case';
import type { CreateUserData } from '../repositories/users-repository.interface';

describe('CreateUserUseCase', () => {
  const usersRepository = {
    existsByUsernameOrEmail: jest.fn(),
    create: jest.fn<Promise<unknown>, [CreateUserData]>(),
  };
  const configService = { get: jest.fn().mockReturnValue(10) };

  let useCase: CreateUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockReturnValue(10);
    useCase = new CreateUserUseCase(
      usersRepository as never,
      configService as never,
    );
  });

  const dto = {
    username: 'jdoe',
    email: 'jdoe@example.com',
    password: 'StrongP@ssw0rd',
    fullName: 'John Doe',
    roleId: 'role-1',
  };

  it('throws Conflict when username or email already exists', async () => {
    usersRepository.existsByUsernameOrEmail.mockResolvedValue(true);

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(usersRepository.create).not.toHaveBeenCalled();
  });

  it('hashes the password and persists the user', async () => {
    usersRepository.existsByUsernameOrEmail.mockResolvedValue(false);
    usersRepository.create.mockResolvedValue({ id: 'user-1', ...dto });

    await useCase.execute(dto);

    expect(usersRepository.create).toHaveBeenCalledTimes(1);
    const createArg = usersRepository.create.mock.calls[0][0];
    expect(createArg.password).not.toBe(dto.password);
    expect(await bcrypt.compare(dto.password, createArg.password)).toBe(true);
  });
});
