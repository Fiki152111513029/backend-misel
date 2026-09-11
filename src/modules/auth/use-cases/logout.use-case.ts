import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LogoutDto } from '../dto/logout.dto';
import { REFRESH_TOKEN_REPOSITORY } from '../repositories/refresh-token-repository.interface';
import type { IRefreshTokenRepository } from '../repositories/refresh-token-repository.interface';
import { USERS_REPOSITORY } from '../../users/repositories/users-repository.interface';
import type { IUsersRepository } from '../../users/repositories/users-repository.interface';
import { hashToken } from '../utils/hash-token.util';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(dto: LogoutDto, currentUserId: string): Promise<void> {
    const tokenHash = hashToken(dto.refreshToken);
    const storedToken = await this.refreshTokenRepository.findByHash(tokenHash);

    if (!storedToken || storedToken.userId !== currentUserId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!storedToken.revoked) {
      await this.refreshTokenRepository.revoke(storedToken.id);
    }

    await this.usersRepository.setOnlineStatus(currentUserId, false);
  }
}
