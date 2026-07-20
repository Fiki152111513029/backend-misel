import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { USERS_REPOSITORY } from '../../users/repositories/users-repository.interface';
import type { IUsersRepository } from '../../users/repositories/users-repository.interface';
import { LoginDto } from '../dto/login.dto';
import { REFRESH_TOKEN_REPOSITORY } from '../repositories/refresh-token-repository.interface';
import type { IRefreshTokenRepository } from '../repositories/refresh-token-repository.interface';
import { TokenService } from '../services/token.service';
import { hashToken } from '../utils/hash-token.util';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: LoginDto) {
    const user = await this.usersRepository.findByIdentifier(dto.identifier);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const permissions = user.role.permissions.map((rp) => rp.permission.code);

    const accessToken = this.tokenService.signAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role.name,
      permissions,
    });

    const { token: refreshToken, expiresAt } =
      this.tokenService.signRefreshToken(user.id);
    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
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
