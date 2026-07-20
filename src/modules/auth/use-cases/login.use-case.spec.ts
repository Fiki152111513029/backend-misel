import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from './login.use-case';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));
import * as bcrypt from 'bcrypt';

describe('LoginUseCase', () => {
  const baseUser = {
    id: 'user-1',
    username: 'jdoe',
    email: 'jdoe@example.com',
    fullName: 'John Doe',
    password: 'hashed-password',
    isActive: true,
    role: {
      name: 'Admin',
      permissions: [{ permission: { code: 'user.read' } }],
    },
  };

  const usersRepository = { findByIdentifier: jest.fn() };
  const refreshTokenRepository = { create: jest.fn() };
  const tokenService = {
    signAccessToken: jest.fn().mockReturnValue('access-token'),
    signRefreshToken: jest
      .fn()
      .mockReturnValue({ token: 'refresh-token', expiresAt: new Date() }),
  };

  let useCase: LoginUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new LoginUseCase(
      usersRepository as never,
      refreshTokenRepository as never,
      tokenService as never,
    );
  });

  it('throws Unauthorized when user does not exist', async () => {
    usersRepository.findByIdentifier.mockResolvedValue(null);

    await expect(
      useCase.execute({ identifier: 'nobody', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws Unauthorized when user is inactive', async () => {
    usersRepository.findByIdentifier.mockResolvedValue({
      ...baseUser,
      isActive: false,
    });

    await expect(
      useCase.execute({ identifier: 'jdoe', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws Unauthorized when password does not match', async () => {
    usersRepository.findByIdentifier.mockResolvedValue(baseUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      useCase.execute({ identifier: 'jdoe', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns tokens and user info on success', async () => {
    usersRepository.findByIdentifier.mockResolvedValue(baseUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await useCase.execute({
      identifier: 'jdoe',
      password: 'correct',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user).toMatchObject({
      id: 'user-1',
      username: 'jdoe',
      role: 'Admin',
      permissions: ['user.read'],
    });
    expect(refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
    );
  });
});
