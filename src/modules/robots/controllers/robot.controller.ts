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
import { RobotStatusSummaryQueryDto } from '../dto/robot-status-summary-query.dto';
import { RobotStatusMonthlyQueryDto } from '../dto/robot-status-monthly-query.dto';
import { UpdateRobotDto } from '../dto/update-robot.dto';
import { RobotTelemetryService } from '../services/robot-telemetry.service';
import { ControlRobotUseCase } from '../use-cases/control-robot.use-case';
import { CreateRobotUseCase } from '../use-cases/create-robot.use-case';
import { DeleteRobotUseCase } from '../use-cases/delete-robot.use-case';
import { GetFleetStatusUseCase } from '../use-cases/get-fleet-status.use-case';
import { GetRobotActivityUseCase } from '../use-cases/get-robot-activity.use-case';
import { GetRobotStatusSummaryUseCase } from '../use-cases/get-robot-status-summary.use-case';
import { GetRobotStatusMonthlySummaryUseCase } from '../use-cases/get-robot-status-monthly-summary.use-case';
import { GetRobotSystemStatusUseCase } from '../use-cases/get-robot-system-status.use-case';
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
    private readonly getRobotSystemStatusUseCase: GetRobotSystemStatusUseCase,
    private readonly getFleetStatusUseCase: GetFleetStatusUseCase,
    private readonly getRobotStatusSummaryUseCase: GetRobotStatusSummaryUseCase,
    private readonly getRobotStatusMonthlySummaryUseCase: GetRobotStatusMonthlySummaryUseCase,
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

  @Get('system-status')
  @Permissions('robot.read')
  @ApiOperation({
    summary:
      'Overall AMR fleet connectivity: online if the telemetry endpoint is reachable and at least one robot is reporting a non-Offline state',
  })
  async systemStatus() {
    const data = await this.getRobotSystemStatusUseCase.execute();
    return {
      success: true,
      message: 'Robot system status retrieved successfully',
      data,
    };
  }

  @Get('fleet-status')
  @Permissions('robot.read')
  @ApiOperation({
    summary:
      "AMR Fleet Real-time Status for the Dashboard: each robot's live state, current mission (resolved from its active task's subTaskSeq via the Model Code Process), payload, and battery",
  })
  async fleetStatus() {
    const data = await this.getFleetStatusUseCase.execute();
    return {
      success: true,
      message: 'Fleet status retrieved successfully',
      data,
    };
  }

  @Get('status-summary')
  @Permissions('robot.read')
  @ApiOperation({
    summary:
      "Running/Idle/Charging minutes per robot for one shift (Sesi 1: 07:00-16:15 WIB, Sesi 2: 07:15-16:30 WIB, both tracked up to a 21:00 WIB overtime cutoff) on one calendar day (query params: date YYYY-MM-DD, shift SESI_1|SESI_2; Offline time isn't counted) — the AMR Performance chart's daily view. Today is computed live from RobotActivityLog; past days read the permanent RobotStatusDailySummary rollup (falling back to a live computation if that day was never rolled up and its raw logs haven't been purged yet)",
  })
  async statusSummary(@Query() query: RobotStatusSummaryQueryDto) {
    const data = await this.getRobotStatusSummaryUseCase.execute(query);
    return {
      success: true,
      message: 'Robot status summary retrieved successfully',
      data,
    };
  }

  @Get('status-summary/monthly')
  @Permissions('robot.read')
  @ApiOperation({
    summary:
      "Running/Idle/Charging minutes per robot averaged or totaled across one calendar month, for one shift (query params: month YYYY-MM, shift SESI_1|SESI_2, mode AVERAGE|TOTAL) — the AMR Performance chart's Average/Total per Month views. Only reads the permanent RobotStatusDailySummary rollup, so days that were never rolled up (including the current, still-in-progress day) are excluded rather than estimated",
  })
  async statusSummaryMonthly(@Query() query: RobotStatusMonthlyQueryDto) {
    const data = await this.getRobotStatusMonthlySummaryUseCase.execute(query);
    return {
      success: true,
      message: 'Robot status monthly summary retrieved successfully',
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
