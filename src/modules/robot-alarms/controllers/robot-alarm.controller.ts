import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { AlarmDashboardStatsQueryDto } from '../dto/alarm-dashboard-stats-query.dto';
import { GetAlarmDashboardStatsUseCase } from '../use-cases/get-alarm-dashboard-stats.use-case';

@ApiTags('Robot Alarms')
@ApiBearerAuth('access-token')
@Controller('robot-alarms')
export class RobotAlarmController {
  constructor(
    private readonly getAlarmDashboardStatsUseCase: GetAlarmDashboardStatsUseCase,
  ) {}

  @Get('dashboard-stats')
  @Permissions('robot-alarm.read')
  @ApiOperation({
    summary:
      "Critical (Emergency-grade) alarm count and per-zone alarm density within the last N hours — powers the main Dashboard's Critical Alarms stat and Abnormality chart",
  })
  async dashboardStats(@Query() query: AlarmDashboardStatsQueryDto) {
    const data = await this.getAlarmDashboardStatsUseCase.execute(query);
    return {
      success: true,
      message: 'Alarm dashboard stats retrieved successfully',
      data,
    };
  }
}
