import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CreatePlcDeviceDto } from '../dto/create-plc-device.dto';
import { UpdatePlcDeviceDto } from '../dto/update-plc-device.dto';
import { CreatePlcTagDto } from '../dto/create-plc-tag.dto';
import { UpdatePlcTagDto } from '../dto/update-plc-tag.dto';
import {
  PlcDeviceQueryDto,
  PlcReadingQueryDto,
  PlcTagQueryDto,
} from '../dto/plc-query.dto';
import {
  CreatePlcDeviceUseCase,
  DeletePlcDeviceUseCase,
  GetPlcDeviceUseCase,
  GetPlcDevicesUseCase,
  TestPlcDeviceUseCase,
  UpdatePlcDeviceUseCase,
} from '../use-cases/plc-device.use-cases';
import {
  CreatePlcTagUseCase,
  DeletePlcTagUseCase,
  GetPlcLiveUseCase,
  GetPlcReadingsUseCase,
  GetPlcTagsUseCase,
  UpdatePlcTagUseCase,
} from '../use-cases/plc-tag.use-cases';

/**
 * Read-only towards the PLC.
 *
 * There is no write endpoint and there is not meant to be one: a PLC drives
 * real actuators, and a write to a mistyped address can move machinery with
 * someone's hand in it. Everything here either reads the device or edits our
 * own configuration of it.
 */
@ApiTags('PLC')
@ApiBearerAuth('access-token')
@Controller('plc')
export class PlcController {
  constructor(
    private readonly getDevices: GetPlcDevicesUseCase,
    private readonly getDevice: GetPlcDeviceUseCase,
    private readonly createDevice: CreatePlcDeviceUseCase,
    private readonly updateDevice: UpdatePlcDeviceUseCase,
    private readonly deleteDevice: DeletePlcDeviceUseCase,
    private readonly testDevice: TestPlcDeviceUseCase,
    private readonly getTags: GetPlcTagsUseCase,
    private readonly createTag: CreatePlcTagUseCase,
    private readonly updateTag: UpdatePlcTagUseCase,
    private readonly deleteTag: DeletePlcTagUseCase,
    private readonly getLive: GetPlcLiveUseCase,
    private readonly getReadings: GetPlcReadingsUseCase,
  ) {}

  // ---- Live values ------------------------------------------------------

  // Declared before the parameterised device routes so "live" is not taken
  // for a device id.
  @Get('live')
  @Permissions('plc.read')
  @ApiOperation({
    summary:
      'Current value of every tag, per device. One call on page load; the socket carries the rest.',
  })
  live() {
    return {
      success: true,
      message: 'PLC values retrieved successfully',
      data: this.getLive.execute(),
    };
  }

  @Get('readings')
  @Permissions('plc.read')
  @ApiOperation({ summary: 'Value-change history (pagination, filter by tag and day)' })
  async readings(@Query() query: PlcReadingQueryDto) {
    return {
      success: true,
      message: 'PLC readings retrieved successfully',
      data: await this.getReadings.execute(query),
    };
  }

  // ---- Tags -------------------------------------------------------------

  @Get('tags')
  @Permissions('plc.read')
  @ApiOperation({ summary: 'List tags (pagination, filter by device)' })
  async tags(@Query() query: PlcTagQueryDto) {
    return {
      success: true,
      message: 'PLC tags retrieved successfully',
      data: await this.getTags.execute(query),
    };
  }

  @Post('tags')
  @Permissions('plc.create')
  @ApiOperation({ summary: 'Add a tag to a device' })
  async addTag(@Body() dto: CreatePlcTagDto) {
    return {
      success: true,
      message: 'PLC tag created successfully',
      data: await this.createTag.execute(dto),
    };
  }

  @Put('tags/:id')
  @Permissions('plc.update')
  @ApiOperation({ summary: 'Update a tag' })
  async editTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlcTagDto,
  ) {
    return {
      success: true,
      message: 'PLC tag updated successfully',
      data: await this.updateTag.execute(id, dto),
    };
  }

  @Delete('tags/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions('plc.delete')
  @ApiOperation({ summary: 'Soft delete a tag' })
  async removeTag(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteTag.execute(id);
    return { success: true, message: 'PLC tag deleted successfully', data: null };
  }

  // ---- Devices ----------------------------------------------------------

  @Get('devices')
  @Permissions('plc.read')
  @ApiOperation({ summary: 'List devices with their tags and live connection state' })
  async devices(@Query() query: PlcDeviceQueryDto) {
    return {
      success: true,
      message: 'PLC devices retrieved successfully',
      data: await this.getDevices.execute(query),
    };
  }

  @Get('devices/:id')
  @Permissions('plc.read')
  @ApiOperation({ summary: 'Get one device' })
  async device(@Param('id', ParseUUIDPipe) id: string) {
    return {
      success: true,
      message: 'PLC device retrieved successfully',
      data: await this.getDevice.execute(id),
    };
  }

  @Post('devices')
  @Permissions('plc.create')
  @ApiOperation({ summary: 'Add a Modbus TCP device' })
  async addDevice(@Body() dto: CreatePlcDeviceDto) {
    return {
      success: true,
      message: 'PLC device created successfully',
      data: await this.createDevice.execute(dto),
    };
  }

  @Put('devices/:id')
  @Permissions('plc.update')
  @ApiOperation({ summary: 'Update a device' })
  async editDevice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlcDeviceDto,
  ) {
    return {
      success: true,
      message: 'PLC device updated successfully',
      data: await this.updateDevice.execute(id, dto),
    };
  }

  @Delete('devices/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions('plc.delete')
  @ApiOperation({ summary: 'Soft delete a device and its tags' })
  async removeDevice(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteDevice.execute(id);
    return {
      success: true,
      message: 'PLC device deleted successfully',
      data: null,
    };
  }

  // Not @Permissions('plc.read'): it opens a socket to factory equipment,
  // so it sits with the actions that change configuration rather than with
  // the ones that only look at it.
  @Post('devices/:id/test')
  @HttpCode(HttpStatus.OK)
  @Permissions('plc.update')
  @ApiOperation({
    summary:
      'Connect and read one register, to tell a wrong IP from a wrong port, unit id or address',
  })
  async test(@Param('id', ParseUUIDPipe) id: string) {
    return {
      success: true,
      message: 'PLC connection test finished',
      data: await this.testDevice.execute(id),
    };
  }
}
