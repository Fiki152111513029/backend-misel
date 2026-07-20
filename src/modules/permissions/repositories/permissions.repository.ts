import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreatePermissionData,
  IPermissionsRepository,
  UpdatePermissionData,
} from './permissions-repository.interface';

@Injectable()
export class PermissionsRepository implements IPermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.permission.findMany();
  }

  findById(id: string) {
    return this.prisma.permission.findUnique({ where: { id } });
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.permission.count({ where: { code } });
    return count > 0;
  }

  create(data: CreatePermissionData) {
    return this.prisma.permission.create({ data });
  }

  update(id: string, data: UpdatePermissionData) {
    return this.prisma.permission.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.permission.delete({ where: { id } });
  }
}
