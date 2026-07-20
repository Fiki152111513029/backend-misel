import { Prisma, Role } from '@prisma/client';

export type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: { permissions: { include: { permission: true } } };
}>;

export interface CreateRoleData {
  name: string;
  description?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
}

export const ROLES_REPOSITORY = 'ROLES_REPOSITORY';

export interface IRolesRepository {
  findAll(): Promise<RoleWithPermissions[]>;
  findById(id: string): Promise<RoleWithPermissions | null>;
  existsByName(name: string): Promise<boolean>;
  create(data: CreateRoleData): Promise<Role>;
  update(id: string, data: UpdateRoleData): Promise<Role>;
  remove(id: string): Promise<void>;
  setPermissions(roleId: string, permissionIds: string[]): Promise<void>;
}
