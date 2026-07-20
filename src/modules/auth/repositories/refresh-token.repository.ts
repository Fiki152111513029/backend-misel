import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateRefreshTokenData,
  IRefreshTokenRepository,
} from './refresh-token-repository.interface';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateRefreshTokenData) {
    return this.prisma.refreshToken.create({ data });
  }

  findByHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async revoke(id: string, replacedByTokenHash?: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revoked: true, replacedByTokenHash },
    });
  }
}
