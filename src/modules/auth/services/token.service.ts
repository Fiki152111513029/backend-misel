import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { AccessTokenPayload } from '../strategies/jwt.strategy';

type ExpiresIn = JwtSignOptions['expiresIn'];

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export interface AccessTokenClaims {
  userId: string;
  username: string;
  role: string;
  permissions: string[];
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signAccessToken(claims: AccessTokenClaims): string {
    const payload: AccessTokenPayload = {
      sub: claims.userId,
      username: claims.username,
      role: claims.role,
      permissions: claims.permissions,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>(
        'jwt.accessExpiresIn',
      ) as ExpiresIn,
    });
  }

  signRefreshToken(userId: string): { token: string; expiresAt: Date } {
    const payload: RefreshTokenPayload = { sub: userId, jti: randomUUID() };
    const expiresIn = this.configService.get<string>(
      'jwt.refreshExpiresIn',
      '7d',
    );

    const token = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: expiresIn as ExpiresIn,
    });

    return { token, expiresAt: this.computeExpiryDate(expiresIn) };
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return this.jwtService.verify<RefreshTokenPayload>(token, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
    });
  }

  private computeExpiryDate(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) {
      // Fallback: treat as seconds if it's a plain number, else default to 7 days.
      const seconds = Number(expiresIn);
      return new Date(
        Date.now() + (Number.isFinite(seconds) ? seconds : 604_800) * 1000,
      );
    }

    const value = Number(match[1]);
    const unitMs: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };

    return new Date(Date.now() + value * unitMs[match[2]]);
  }
}
