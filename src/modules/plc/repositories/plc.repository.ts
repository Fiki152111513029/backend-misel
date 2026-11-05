import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreatePlcDeviceData,
  CreatePlcTagData,
  FindAllPlcDevicesParams,
  FindAllPlcReadingsParams,
  FindAllPlcTagsParams,
  IPlcRepository,
  PaginatedResult,
  PlcDeviceWithTags,
  PlcReadingInput,
  PlcReadingWithTag,
  PlcTagWithDevice,
  UpdatePlcDeviceData,
  UpdatePlcTagData,
} from './plc-repository.interface';

const NOT_DELETED = { deletedAt: null } as const;

/**
 * Ceiling on the value history.
 *
 * The table grows on its own, unattended, from a background poller — the
 * same shape of problem as the AGV log, and capped the same way. Trimming
 * on a fraction of writes keeps the cost off the common path while still
 * bounding the table.
 */
const MAX_READINGS = 20_000;
const TRIM_TO = 18_000;
const TRIM_EVERY = 25;

const DEVICE_WITH_TAGS = {
  tags: { where: NOT_DELETED, orderBy: { address: 'asc' } },
} satisfies Prisma.PlcDeviceInclude;

const TAG_WITH_DEVICE = {
  device: { select: { id: true, name: true } },
} satisfies Prisma.PlcTagInclude;

@Injectable()
export class PlcRepository implements IPlcRepository {
  private writesSinceTrim = 0;

  constructor(private readonly prisma: PrismaService) {}

  // ---- Devices ----------------------------------------------------------

  async findAllDevices(
    params: FindAllPlcDevicesParams,
  ): Promise<PaginatedResult<PlcDeviceWithTags>> {
    const where: Prisma.PlcDeviceWhereInput = {
      ...NOT_DELETED,
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { host: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.plcDevice.findMany({
        where,
        include: DEVICE_WITH_TAGS,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.plcDevice.count({ where }),
    ]);

    return { items, total };
  }

  findDeviceById(id: string) {
    return this.prisma.plcDevice.findFirst({
      where: { id, ...NOT_DELETED },
      include: DEVICE_WITH_TAGS,
    });
  }

  findPollableDevices() {
    return this.prisma.plcDevice.findMany({
      where: { ...NOT_DELETED, isActive: true },
      include: {
        // Inactive tags are left out here rather than filtered in the
        // poller, so switching one off really does stop it being read.
        tags: {
          where: { ...NOT_DELETED, isActive: true },
          orderBy: { address: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async deviceNameExists(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.plcDevice.count({
      where: {
        ...NOT_DELETED,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  createDevice(data: CreatePlcDeviceData) {
    return this.prisma.plcDevice.create({
      data,
      include: DEVICE_WITH_TAGS,
    });
  }

  updateDevice(id: string, data: UpdatePlcDeviceData) {
    return this.prisma.plcDevice.update({
      where: { id },
      data,
      include: DEVICE_WITH_TAGS,
    });
  }

  async softDeleteDevice(id: string): Promise<void> {
    const deletedAt = new Date();
    // The tags go with it. Left behind they would be unreachable rows the
    // poller still loads, and their names would keep blocking reuse under
    // the partial unique index.
    await this.prisma.$transaction([
      this.prisma.plcTag.updateMany({
        where: { deviceId: id, ...NOT_DELETED },
        data: { deletedAt },
      }),
      this.prisma.plcDevice.update({ where: { id }, data: { deletedAt } }),
    ]);
  }

  // ---- Tags -------------------------------------------------------------

  async findAllTags(
    params: FindAllPlcTagsParams,
  ): Promise<PaginatedResult<PlcTagWithDevice>> {
    const where: Prisma.PlcTagWhereInput = {
      ...NOT_DELETED,
      ...(params.deviceId ? { deviceId: params.deviceId } : {}),
      ...(params.search
        ? { name: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.plcTag.findMany({
        where,
        include: TAG_WITH_DEVICE,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.plcTag.count({ where }),
    ]);

    return { items, total };
  }

  findTagById(id: string) {
    return this.prisma.plcTag.findFirst({
      where: { id, ...NOT_DELETED },
      include: TAG_WITH_DEVICE,
    });
  }

  async tagNameExists(deviceId: string, name: string, excludeId?: string) {
    const count = await this.prisma.plcTag.count({
      where: {
        ...NOT_DELETED,
        deviceId,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  createTag(data: CreatePlcTagData) {
    return this.prisma.plcTag.create({ data, include: TAG_WITH_DEVICE });
  }

  updateTag(id: string, data: UpdatePlcTagData) {
    return this.prisma.plcTag.update({
      where: { id },
      data,
      include: TAG_WITH_DEVICE,
    });
  }

  async softDeleteTag(id: string): Promise<void> {
    await this.prisma.plcTag.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ---- Readings ---------------------------------------------------------

  async recordReadings(readings: PlcReadingInput[]): Promise<void> {
    if (readings.length === 0) return;

    await this.prisma.plcReading.createMany({ data: readings });

    this.writesSinceTrim += 1;
    if (this.writesSinceTrim < TRIM_EVERY) return;
    this.writesSinceTrim = 0;

    // Raw SQL because Prisma cannot express "delete all but the newest N".
    // Trimming is housekeeping, so a failure here must not take down the
    // poll that happened to trigger it.
    try {
      await this.prisma.$executeRaw`
        DELETE FROM "plc_readings"
        WHERE "id" IN (
          SELECT "id" FROM "plc_readings"
          ORDER BY "createdAt" DESC
          OFFSET ${TRIM_TO}
        )
      `;
    } catch {
      // Left for the next trim to retry.
    }
  }

  async findAllReadings(
    params: FindAllPlcReadingsParams,
  ): Promise<PaginatedResult<PlcReadingWithTag>> {
    const where: Prisma.PlcReadingWhereInput = {
      ...(params.tagId ? { tagId: params.tagId } : {}),
      ...dayRange(params.date),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.plcReading.findMany({
        where,
        include: { tag: { select: { id: true, name: true, unit: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.plcReading.count({ where }),
    ]);

    return { items, total };
  }
}

/** One calendar day in server local time, or nothing when no date is given. */
function dayRange(date?: string): Prisma.PlcReadingWhereInput {
  if (!date) return {};
  const start = new Date(`${date}T00:00:00`);
  if (Number.isNaN(start.getTime())) return {};
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { createdAt: { gte: start, lt: end } };
}

export { MAX_READINGS };
