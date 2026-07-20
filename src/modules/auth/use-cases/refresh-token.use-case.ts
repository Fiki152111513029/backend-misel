import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USERS_REPOSITORY } from '../../users/repositories/users-repository.interface';
import type { IUsersRepository } from '../../users/repositories/users-repository.interface';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { REFRESH_TOKEN_REPOSITORY } from '../repositories/refresh-token-repository.interface';
import type { IRefreshTokenRepository } from '../repositories/refresh-token-repository.interface';
import { TokenService } from '../services/token.service';
import { hashToken } from '../utils/hash-token.util';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: RefreshTokenDto) {
    let payload: { sub: string };
    try {
      payload = this.tokenService.verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(dto.refreshToken);
    const storedToken = await this.refreshTokenRepository.findByHash(tokenHash);

    if (
      !storedToken ||
      storedToken.revoked ||
      storedToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const permissions = user.role.permissions.map((rp) => rp.permission.code);

    const accessToken = this.tokenService.signAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role.name,
      permissions,
    });

    const { token: newRefreshToken, expiresAt } =
      this.tokenService.signRefreshToken(user.id);
    const newTokenHash = hashToken(newRefreshToken);

    await this.refreshTokenRepository.revoke(storedToken.id, newTokenHash);
    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role.name,
        permissions,
      },
    };
  }
}
