import { Permission } from '@prisma/client';

export interface CreatePermissionData {
  code: string;
  name: string;
  description?: string;
}

export interface UpdatePermissionData {
  code?: string;
  name?: string;
  description?: string;
}

export const PERMISSIONS_REPOSITORY = 'PERMISSIONS_REPOSITORY';

export interface IPermissionsRepository {
  findAll(): Promise<Permission[]>;
  findById(id: string): Promise<Permission | null>;
  existsByCode(code: string): Promise<boolean>;
  create(data: CreatePermissionData): Promise<Permission>;
  update(id: string, data: UpdatePermissionData): Promise<Permission>;
  remove(id: string): Promise<void>;
}
