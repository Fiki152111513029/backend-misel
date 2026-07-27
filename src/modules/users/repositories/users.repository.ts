import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateUserData,
  IUsersRepository,
  UpdateUserData,
  UserWithRole,
} from './users-repository.interface';

const ROLE_WITH_PERMISSIONS_INCLUDE = {
  role: { include: { permissions: { include: { permission: true } } } },
} as const;
const NOT_DELETED = { deletedAt: null } as const;

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByIdentifier(identifier: string): Promise<UserWithRole | null> {
    return this.prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }], ...NOT_DELETED },
      include: ROLE_WITH_PERMISSIONS_INCLUDE,
    });
  }

  findById(id: string): Promise<UserWithRole | null> {
    return this.prisma.user.findFirst({
      where: { id, ...NOT_DELETED },
      include: ROLE_WITH_PERMISSIONS_INCLUDE,
    });
  }

  findAll(): Promise<UserWithRole[]> {
    return this.prisma.user.findMany({
      where: { ...NOT_DELETED },
      include: ROLE_WITH_PERMISSIONS_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async existsByUsernameOrEmail(
    username: string,
    email?: string,
  ): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { OR: email ? [{ username }, { email }] : [{ username }] },
    });
    return count > 0;
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        email,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsByUsername(username: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        username,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  create(data: CreateUserData) {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: UpdateUserData) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    // Soft-delete the user AND cascade a soft-delete to everything that
    // required them as operator, instead of a hard DB delete — Task /
    // WarehouseCartTask / ProductionLine / WarehouseOperatorLocation all
    // have a required (non-nullable) operatorId FK, so a hard delete would
    // either be rejected outright (RESTRICT) or destroy that history. This
    // way the delete always succeeds, related records disappear from active
    // views, and everything stays intact in the DB for audit/reporting.
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.task.updateMany({
        where: { operatorId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.warehouseCartTask.updateMany({
        where: { operatorId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.productionLine.updateMany({
        where: { operatorId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.warehouseOperatorLocation.updateMany({
        where: { operatorId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.user.update({
        where: { id },
        data: { deletedAt: now, isActive: false },
      }),
    ]);
  }
}
