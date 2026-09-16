import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { RobotAlarmQueryDto } from '../dto/robot-alarm-query.dto';
import { GetAlarmDashboardStatsUseCase } from '../use-cases/get-alarm-dashboard-stats.use-case';
import { GetRobotAlarmsUseCase } from '../use-cases/get-robot-alarms.use-case';
import { GetActiveAlarmDeviceNamesUseCase } from '../use-cases/get-active-alarm-device-names.use-case';

@ApiTags('Robot Alarms')
@ApiBearerAuth('access-token')
@Controller('robot-alarms')
export class RobotAlarmController {
  constructor(
    private readonly getAlarmDashboardStatsUseCase: GetAlarmDashboardStatsUseCase,
    private readonly getRobotAlarmsUseCase: GetRobotAlarmsUseCase,
    private readonly getActiveAlarmDeviceNamesUseCase: GetActiveAlarmDeviceNamesUseCase,
  ) {}

  // Must come before @Get() (the plain list) — not ambiguous today since
  // that one has no path segment, but keeping every literal route above
  // any parameterized one is the safer long-term convention (see
  // ShiftController's :id vs "current").
  @Get('active-devices')
  @Permissions('robot-alarm.read')
  @ApiOperation({
    summary:
      'deviceName of every device currently in an active, unresolved alarm — powers the Factory Map alarm badge',
  })
  async activeDevices() {
    const data = await this.getActiveAlarmDeviceNamesUseCase.execute();
    return {
      success: true,
      message: 'Active alarm devices retrieved successfully',
      data,
    };
  }

  @Get('dashboard-stats')
  @Permissions('robot-alarm.read')
  @ApiOperation({
    summary:
      "Currently-active alarm snapshot, based on alarmStatus (0=active, 1=resolved) rather than a time window — an alarm counts from the moment it's reported active until RCS reports it resolved. Critical (Emergency-grade) count, per-zone density, and the raw device/desc list all derive from the same active set — powers the main Dashboard's Critical Alarms stat and Abnormality panel",
  })
  async dashboardStats() {
    const data = await this.getAlarmDashboardStatsUseCase.execute();
    return {
      success: true,
      message: 'Alarm dashboard stats retrieved successfully',
      data,
    };
  }

  @Get()
  @Permissions('robot-alarm.read')
  @ApiOperation({
    summary:
      'List every received robot alarm (pagination), newest first — the Alarm Logs page under ICS Logs',
  })
  async findAll(@Query() query: RobotAlarmQueryDto) {
    const data = await this.getRobotAlarmsUseCase.execute(query);
    return {
      success: true,
      message: 'Robot alarms retrieved successfully',
      data,
    };
  }
}
