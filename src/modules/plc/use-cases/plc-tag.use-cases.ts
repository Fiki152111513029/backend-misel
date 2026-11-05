import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../common/utils/prisma-errors';
import { RealtimeService } from '../../realtime/realtime.service';
import { CreatePlcTagDto } from '../dto/create-plc-tag.dto';
import { UpdatePlcTagDto } from '../dto/update-plc-tag.dto';
import { PlcReadingQueryDto, PlcTagQueryDto } from '../dto/plc-query.dto';
import { PLC_REPOSITORY } from '../repositories/plc-repository.interface';
import type { IPlcRepository } from '../repositories/plc-repository.interface';
import { PlcPollerService } from '../services/plc-poller.service';
import { PlcValueCacheService } from '../services/plc-value-cache.service';

@Injectable()
export class GetPlcTagsUseCase {
  constructor(
    @Inject(PLC_REPOSITORY) private readonly repository: IPlcRepository,
  ) {}

  async execute(query: PlcTagQueryDto) {
    const { items, total } = await this.repository.findAllTags(query);
    return {
      items,
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
export class CreatePlcTagUseCase {
  constructor(
    @Inject(PLC_REPOSITORY) private readonly repository: IPlcRepository,
    private readonly poller: PlcPollerService,
    private readonly realtime: RealtimeService,
  ) {}

  async execute(dto: CreatePlcTagDto) {
    const device = await this.repository.findDeviceById(dto.deviceId);
    if (!device) throw new BadRequestException('PLC device not found');

    if (await this.repository.tagNameExists(dto.deviceId, dto.name)) {
      throw new BadRequestException(
        'This device already has a tag with that name',
      );
    }

    try {
      const tag = await this.repository.createTag(dto);
      this.poller.invalidateRoster();
      this.realtime.publish('plc');
      return tag;
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'This device already has a tag with that name',
        );
      }
      throw error;
    }
  }
}

@Injectable()
export class UpdatePlcTagUseCase {
  constructor(
    @Inject(PLC_REPOSITORY) private readonly repository: IPlcRepository,
    private readonly poller: PlcPollerService,
    private readonly realtime: RealtimeService,
  ) {}

  async execute(id: string, dto: UpdatePlcTagDto) {
    const existing = await this.repository.findTagById(id);
    if (!existing) throw new NotFoundException('PLC tag not found');

    if (dto.name && dto.name !== existing.name) {
      if (
        await this.repository.tagNameExists(existing.deviceId, dto.name, id)
      ) {
        throw new BadRequestException(
          'This device already has a tag with that name',
        );
      }
    }

    try {
      const tag = await this.repository.updateTag(id, dto);
      this.poller.invalidateRoster();
      this.realtime.publish('plc');
      return tag;
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'This device already has a tag with that name',
        );
      }
      throw error;
    }
  }
}

@Injectable()
export class DeletePlcTagUseCase {
  constructor(
    @Inject(PLC_REPOSITORY) private readonly repository: IPlcRepository,
    private readonly poller: PlcPollerService,
    private readonly realtime: RealtimeService,
  ) {}

  async execute(id: string) {
    const existing = await this.repository.findTagById(id);
    if (!existing) throw new NotFoundException('PLC tag not found');

    await this.repository.softDeleteTag(id);
    this.poller.invalidateRoster();
    this.realtime.publish('plc');
  }
}

/**
 * Current values for every device, for a page that has just opened.
 *
 * Read from memory, never from plc_readings: that table holds changes
 * only, so a value steady for an hour has no recent row there. After this
 * one call the page is fed by the socket and makes no further requests.
 */
@Injectable()
export class GetPlcLiveUseCase {
  constructor(private readonly cache: PlcValueCacheService) {}

  execute() {
    return this.cache.all();
  }
}

@Injectable()
export class GetPlcReadingsUseCase {
  constructor(
    @Inject(PLC_REPOSITORY) private readonly repository: IPlcRepository,
  ) {}

  async execute(query: PlcReadingQueryDto) {
    const { items, total } = await this.repository.findAllReadings(query);
    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
