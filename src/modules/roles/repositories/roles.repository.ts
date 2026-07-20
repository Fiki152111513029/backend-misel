import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateRoleData,
  IRolesRepository,
  RoleWithPermissions,
  UpdateRoleData,
} from './roles-repository.interface';

const PERMISSIONS_INCLUDE = {
  permissions: { include: { permission: true } },
} as const;

@Injectable()
export class RolesRepository implements IRolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<RoleWithPermissions[]> {
    return this.prisma.role.findMany({ include: PERMISSIONS_INCLUDE });
  }

  findById(id: string): Promise<RoleWithPermissions | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: PERMISSIONS_INCLUDE,
    });
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.role.count({ where: { name } });
    return count > 0;
  }

  create(data: CreateRoleData) {
    return this.prisma.role.create({ data });
  }

  update(id: string, data: UpdateRoleData) {
    return this.prisma.role.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.role.delete({ where: { id } });
  }

  async setPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      }),
    ]);
  }
}
