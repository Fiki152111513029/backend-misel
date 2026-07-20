import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateRobotData,
  FindAllRobotsParams,
  FindAllRobotsResult,
  IRobotsRepository,
  UpdateRobotData,
} from './robot-repository.interface';

const NOT_DELETED: Prisma.RobotWhereInput = { deletedAt: null };

@Injectable()
export class RobotRepository implements IRobotsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindAllRobotsParams): Promise<FindAllRobotsResult> {
    const where: Prisma.RobotWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.robot.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.robot.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.robot.findFirst({ where: { id, ...NOT_DELETED } });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.robot.count({
      where: {
        name,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsBySerialNo(
    serialNo: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.robot.count({
      where: {
        amrDeviceSerialNo: serialNo,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async existsByDeviceNo(
    deviceNo: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.robot.count({
      where: {
        amrDeviceNo: deviceNo,
        ...NOT_DELETED,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  create(data: CreateRobotData) {
    return this.prisma.robot.create({ data });
  }

  update(id: string, data: UpdateRobotData) {
    return this.prisma.robot.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.robot.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
