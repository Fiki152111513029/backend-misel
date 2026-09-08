import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateCustomerData,
  FindAllCustomersParams,
  FindAllCustomersResult,
  ICustomersRepository,
  UpdateCustomerData,
} from './customer-repository.interface';

const NOT_DELETED: Prisma.CustomerWhereInput = { deletedAt: null };

@Injectable()
export class CustomerRepository implements ICustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllCustomersParams,
  ): Promise<FindAllCustomersResult> {
    const where: Prisma.CustomerWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.customer.findFirst({ where: { id, ...NOT_DELETED } });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.customer.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  create(data: CreateCustomerData) {
    return this.prisma.customer.create({ data });
  }

  update(id: string, data: UpdateCustomerData) {
    return this.prisma.customer.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
