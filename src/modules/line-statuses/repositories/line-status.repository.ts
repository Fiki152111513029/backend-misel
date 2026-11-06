import { Injectable } from '@nestjs/common';
import { LineStatusKind, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ILineStatusesRepository,
  LineStatusWithRaiser,
} from './line-status-repository.interface';

const WITH_RAISER = {
  raisedBy: { select: { id: true, username: true, fullName: true } },
} satisfies Prisma.LineStatusInclude;

@Injectable()
export class LineStatusRepository implements ILineStatusesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<LineStatusWithRaiser[]> {
    return this.prisma.lineStatus.findMany({
      include: WITH_RAISER,
      orderBy: { updatedAt: 'desc' },
    });
  }

  upsert(
    groupName: string,
    kind: LineStatusKind,
    raisedById: string | null,
  ): Promise<LineStatusWithRaiser> {
    return this.prisma.lineStatus.upsert({
      where: { groupName },
      create: { groupName, kind, raisedById },
      update: { kind, raisedById },
      include: WITH_RAISER,
    });
  }

  async clear(groupName: string): Promise<void> {
    // deleteMany, not delete: two people clearing the same line at once is
    // ordinary, and the second one should not get a 500 for being slower.
    await this.prisma.lineStatus.deleteMany({ where: { groupName } });
  }
}
