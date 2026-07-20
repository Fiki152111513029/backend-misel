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

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByIdentifier(identifier: string): Promise<UserWithRole | null> {
    return this.prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
      include: ROLE_WITH_PERMISSIONS_INCLUDE,
    });
  }

  findById(id: string): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: ROLE_WITH_PERMISSIONS_INCLUDE,
    });
  }

  findAll(): Promise<UserWithRole[]> {
    return this.prisma.user.findMany({
      include: ROLE_WITH_PERMISSIONS_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async existsByUsernameOrEmail(
    username: string,
    email: string,
  ): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { OR: [{ username }, { email }] },
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
    await this.prisma.user.delete({ where: { id } });
  }
}
