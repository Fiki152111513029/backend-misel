import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AvailableOperator,
  CreateWarehouseOperatorLocationData,
  FindAllWarehouseOperatorLocationsParams,
  FindAllWarehouseOperatorLocationsResult,
  IWarehouseOperatorLocationsRepository,
  UpdateWarehouseOperatorLocationData,
  WarehouseOperatorLocationWithOperator,
} from './warehouse-operator-location-repository.interface';

const NOT_DELETED: Prisma.WarehouseOperatorLocationWhereInput = {
  deletedAt: null,
};
const OPERATOR_SELECT = {
  operator: { select: { id: true, username: true } },
} as const;

@Injectable()
export class WarehouseOperatorLocationRepository implements IWarehouseOperatorLocationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: FindAllWarehouseOperatorLocationsParams,
  ): Promise<FindAllWarehouseOperatorLocationsResult> {
    const where: Prisma.WarehouseOperatorLocationWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.warehouseOperatorLocation.findMany({
        where,
        include: OPERATOR_SELECT,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.warehouseOperatorLocation.count({ where }),
    ]);

    return { items: items, total };
  }

  findById(id: string) {
    return this.prisma.warehouseOperatorLocation.findFirst({
      where: { id, ...NOT_DELETED },
      include: OPERATOR_SELECT,
    }) as Promise<WarehouseOperatorLocationWithOperator | null>;
  }

  findByOperatorId(operatorId: string) {
    return this.prisma.warehouseOperatorLocation.findFirst({
      where: { operatorId, ...NOT_DELETED },
      include: OPERATOR_SELECT,
    }) as Promise<WarehouseOperatorLocationWithOperator | null>;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.warehouseOperatorLocation.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsByLocationCode(
    code: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.warehouseOperatorLocation.count({
      where: {
        locationCode: code,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsByOperatorId(
    operatorId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.warehouseOperatorLocation.count({
      where: {
        operatorId,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsActiveWarehouseUserById(operatorId: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        id: operatorId,
        isActive: true,
        role: { name: 'Warehouse' },
      },
    });
    return count > 0;
  }

  async findAvailableOperators(
    excludeLocationId?: string,
  ): Promise<AvailableOperator[]> {
    const assigned = await this.prisma.warehouseOperatorLocation.findMany({
      where: {
        ...NOT_DELETED,
        ...(excludeLocationId ? { id: { not: excludeLocationId } } : {}),
      },
      select: { operatorId: true },
    });

    return this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: 'Warehouse' },
        id: { notIn: assigned.map((a) => a.operatorId) },
      },
      select: { id: true, username: true },
      orderBy: { username: 'asc' },
    });
  }

  create(data: CreateWarehouseOperatorLocationData) {
    return this.prisma.warehouseOperatorLocation.create({ data });
  }

  update(id: string, data: UpdateWarehouseOperatorLocationData) {
    return this.prisma.warehouseOperatorLocation.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.warehouseOperatorLocation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
