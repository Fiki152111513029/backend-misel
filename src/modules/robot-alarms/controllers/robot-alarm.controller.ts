import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { AlarmDashboardStatsQueryDto } from '../dto/alarm-dashboard-stats-query.dto';
import { RobotAlarmQueryDto } from '../dto/robot-alarm-query.dto';
import { GetAlarmDashboardStatsUseCase } from '../use-cases/get-alarm-dashboard-stats.use-case';
import { GetRobotAlarmsUseCase } from '../use-cases/get-robot-alarms.use-case';

@ApiTags('Robot Alarms')
@ApiBearerAuth('access-token')
@Controller('robot-alarms')
export class RobotAlarmController {
  constructor(
    private readonly getAlarmDashboardStatsUseCase: GetAlarmDashboardStatsUseCase,
    private readonly getRobotAlarmsUseCase: GetRobotAlarmsUseCase,
  ) {}

  @Get('dashboard-stats')
  @Permissions('robot-alarm.read')
  @ApiOperation({
    summary:
      "Live/current alarm snapshot — Critical (Emergency-grade) alarm count and per-zone alarm density within the last N minutes only, reads 0 once nothing fresh has come in — powers the main Dashboard's Critical Alarms stat and Abnormality chart",
  })
  async dashboardStats(@Query() query: AlarmDashboardStatsQueryDto) {
    const data = await this.getAlarmDashboardStatsUseCase.execute(query);
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
