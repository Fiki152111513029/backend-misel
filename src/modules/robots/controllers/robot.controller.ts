import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ControlRobotDto } from '../dto/control-robot.dto';
import { CreateRobotDto } from '../dto/create-robot.dto';
import { DeviceInfoQueryDto } from '../dto/device-info-query.dto';
import { RobotActivityQueryDto } from '../dto/robot-activity-query.dto';
import { RobotQueryDto } from '../dto/robot-query.dto';
import { UpdateRobotDto } from '../dto/update-robot.dto';
import { RobotTelemetryService } from '../services/robot-telemetry.service';
import { ControlRobotUseCase } from '../use-cases/control-robot.use-case';
import { CreateRobotUseCase } from '../use-cases/create-robot.use-case';
import { DeleteRobotUseCase } from '../use-cases/delete-robot.use-case';
import { GetRobotActivityUseCase } from '../use-cases/get-robot-activity.use-case';
import { GetRobotUseCase } from '../use-cases/get-robot.use-case';
import { GetRobotsUseCase } from '../use-cases/get-robots.use-case';
import { UpdateRobotUseCase } from '../use-cases/update-robot.use-case';

@ApiTags('Robots')
@ApiBearerAuth('access-token')
@Controller('robots')
export class RobotController {
  constructor(
    private readonly createRobotUseCase: CreateRobotUseCase,
    private readonly getRobotsUseCase: GetRobotsUseCase,
    private readonly getRobotUseCase: GetRobotUseCase,
    private readonly updateRobotUseCase: UpdateRobotUseCase,
    private readonly deleteRobotUseCase: DeleteRobotUseCase,
    private readonly robotTelemetryService: RobotTelemetryService,
    private readonly getRobotActivityUseCase: GetRobotActivityUseCase,
    private readonly controlRobotUseCase: ControlRobotUseCase,
  ) {}

  @Post()
  @Permissions('robot.create')
  @ApiOperation({ summary: 'Create a new robot' })
  async create(@Body() dto: CreateRobotDto) {
    const data = await this.createRobotUseCase.execute(dto);
    return {
      success: true,
      message: 'Robot created successfully',
      data,
    };
  }

  @Get()
  @Permissions('robot.read')
  @ApiOperation({
    summary: 'List robots (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: RobotQueryDto) {
    const data = await this.getRobotsUseCase.execute(query);
    return {
      success: true,
      message: 'Robots retrieved successfully',
      data,
    };
  }

  @Get('device-info')
  @Permissions('robot.read')
  @ApiOperation({
    summary:
      'Raw passthrough to the external AMR device-info API for a given area (debug/testing)',
  })
  async deviceInfo(@Query() query: DeviceInfoQueryDto) {
    const data = await this.robotTelemetryService.fetchRawDeviceInfo(
      query.areaId,
      query.deviceType,
    );
    return {
      success: true,
      message: 'Device info retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('robot.read')
  @ApiOperation({ summary: 'Get a robot by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getRobotUseCase.execute(id);
    return {
      success: true,
      message: 'Robot retrieved successfully',
      data,
    };
  }

  @Get(':id/activity')
  @Permissions('robot.read')
  @ApiOperation({
    summary:
      "This robot's telemetry history (Date/Time, Device Code, Device Name, Speed, Battery, Status, State, Position, Payload, Orientation) — recorded as a side effect of the Robots list poll, filterable by date range",
  })
  async activity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: RobotActivityQueryDto,
  ) {
    const data = await this.getRobotActivityUseCase.execute(id, query);
    return {
      success: true,
      message: 'Robot activity retrieved successfully',
      data,
    };
  }

  @Post(':id/control')
  @Permissions('robot.update')
  @ApiOperation({
    summary:
      'Suspend (controlWay 0) or Restore (controlWay 1) this robot via the external AMR fleet API',
  })
  async control(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ControlRobotDto,
  ) {
    const data = await this.controlRobotUseCase.execute(id, dto.controlWay);
    return {
      success: true,
      message:
        dto.controlWay === 0
          ? 'Robot suspended successfully'
          : 'Robot restored successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('robot.update')
  @ApiOperation({ summary: 'Update a robot' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRobotDto,
  ) {
    const data = await this.updateRobotUseCase.execute(id, dto);
    return {
      success: true,
      message: 'Robot updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('robot.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a robot' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteRobotUseCase.execute(id);
    return {
      success: true,
      message: 'Robot deleted successfully',
      data: null,
    };
  }
}
