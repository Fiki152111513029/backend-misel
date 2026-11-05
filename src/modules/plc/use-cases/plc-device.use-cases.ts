import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { RealtimeService } from '../../realtime/realtime.service';
import { CreatePlcDeviceDto } from '../dto/create-plc-device.dto';
import { UpdatePlcDeviceDto } from '../dto/update-plc-device.dto';
import { PlcDeviceQueryDto } from '../dto/plc-query.dto';
import { PLC_REPOSITORY } from '../repositories/plc-repository.interface';
import type { IPlcRepository } from '../repositories/plc-repository.interface';
import { describe, PlcConnectionService } from '../services/plc-connection.service';
import { PlcPollerService } from '../services/plc-poller.service';
import { PlcValueCacheService } from '../services/plc-value-cache.service';

@Injectable()
export class GetPlcDevicesUseCase {
  constructor(
    @Inject(PLC_REPOSITORY) private readonly repository: IPlcRepository,
    private readonly connections: PlcConnectionService,
  ) {}

  async execute(query: PlcDeviceQueryDto) {
    const { items, total } = await this.repository.findAllDevices(query);

    return {
      // Connection state is runtime, not a column: it belongs to the socket
      // this process is holding, and after a restart nothing is connected
      // until the poller has been round. Attached here so the list can show
      // it without a second request.
      items: items.map((device) => ({
        ...device,
        connection: this.connections.status(device.id),
      })),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}

@Injectable()
export class GetPlcDeviceUseCase {
  constructor(
    @Inject(PLC_REPOSITORY) private readonly repository: IPlcRepository,
    private readonly connections: PlcConnectionService,
  ) {}

  async execute(id: string) {
    const device = await this.repository.findDeviceById(id);
    if (!device) throw new NotFoundException('PLC device not found');
    return { ...device, connection: this.connections.status(device.id) };
  }
}

@Injectable()
export class CreatePlcDeviceUseCase {
  constructor(
    @Inject(PLC_REPOSITORY) private readonly repository: IPlcRepository,
    private readonly poller: PlcPollerService,
    private readonly realtime: RealtimeService,
  ) {}

  async execute(dto: CreatePlcDeviceDto) {
    if (await this.repository.deviceNameExists(dto.name)) {
      throw new BadRequestException('A PLC device with this name already exists');
    }

    try {
      const device = await this.repository.createDevice(dto);
      // Otherwise the new device waits out the roster cache before it is
      // first read, which looks like it is not working.
      this.poller.invalidateRoster();
      this.realtime.publish('plc');
      return device;
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'A PLC device with this name already exists',
        );
      }
      throw error;
    }
  }
}

@Injectable()
export class UpdatePlcDeviceUseCase {
  constructor(
    @Inject(PLC_REPOSITORY) private readonly repository: IPlcRepository,
    private readonly connections: PlcConnectionService,
    private readonly cache: PlcValueCacheService,
    private readonly poller: PlcPollerService,
    private readonly realtime: RealtimeService,
  ) {}

  async execute(id: string, dto: UpdatePlcDeviceDto) {
    const existing = await this.repository.findDeviceById(id);
    if (!existing) throw new NotFoundException('PLC device not found');

    if (dto.name && dto.name !== existing.name) {
      if (await this.repository.deviceNameExists(dto.name, id)) {
        throw new BadRequestException(
          'A PLC device with this name already exists',
        );
      }
    }

    try {
      const device = await this.repository.updateDevice(id, dto);

      // The open socket still points at the old address and still uses the
      // old timeout, so it is dropped rather than reused. The next poll
      // reconnects with the new settings.
      this.connections.close(id);
      if (device.isActive === false) this.cache.forget(id);
      this.poller.invalidateRoster();
      this.realtime.publish('plc');
      return device;
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'A PLC device with this name already exists',
        );
      }
      throw error;
    }
  }
}

@Injectable()
export class DeletePlcDeviceUseCase {
  constructor(
    @Inject(PLC_REPOSITORY) private readonly repository: IPlcRepository,
    private readonly connections: PlcConnectionService,
    private readonly cache: PlcValueCacheService,
    private readonly poller: PlcPollerService,
    private readonly realtime: RealtimeService,
  ) {}

  async execute(id: string) {
    const existing = await this.repository.findDeviceById(id);
    if (!existing) throw new NotFoundException('PLC device not found');

    await this.repository.softDeleteDevice(id);
    this.connections.close(id);
    this.cache.forget(id);
    this.poller.invalidateRoster();
    this.realtime.publish('plc');
  }
}

/**
 * Connects once and reads a single register, so the operator finds out
 * whether the address is right from a button rather than by waiting to see
 * if values appear.
 *
 * The first thing anyone needs when a PLC is handed over is to know
 * which of "wrong IP", "blocked port", "wrong unit id" and "wrong address"
 * they are dealing with, and the raw errors do not distinguish them — see
 * describe() in PlcConnectionService.
 */
@Injectable()
export class TestPlcDeviceUseCase {
  constructor(
    @Inject(PLC_REPOSITORY) private readonly repository: IPlcRepository,
    private readonly connections: PlcConnectionService,
  ) {}

  async execute(id: string) {
    const device = await this.repository.findDeviceById(id);
    if (!device) throw new NotFoundException('PLC device not found');

    const probe = device.tags.find((tag) => !tag.deletedAt);
    const registerType = probe?.registerType ?? 'HOLDING_REGISTER';
    const address = probe?.address ?? 0;

    const startedAt = Date.now();
    try {
      const words = await this.connections.readBlock(
        {
          id: device.id,
          host: device.host,
          port: device.port,
          unitId: device.unitId,
          timeoutMs: device.timeoutMs,
        },
        registerType,
        address,
        1,
      );

      return {
        ok: true,
        message: `Connected and read ${registerType} ${address}`,
        raw: words[0] ?? null,
        durationMs: Date.now() - startedAt,
        error: null,
      };
    } catch (error) {
      return {
        ok: false,
        // The explained form, not the raw one: "Timed out" alone sends
        // people looking at the cable when the unit id is wrong.
        message: describe(error),
        raw: null,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
