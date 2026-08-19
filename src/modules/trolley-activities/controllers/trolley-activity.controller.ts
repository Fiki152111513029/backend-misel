import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthRequestUser } from '../../auth/types/auth-request-user.type';
import { LookupTrolleyDto } from '../dto/lookup-trolley.dto';
import { LookupLocationDto } from '../dto/lookup-location.dto';
import { CreateTrolleyActivityDto } from '../dto/create-trolley-activity.dto';
import { TrolleyActivityQueryDto } from '../dto/trolley-activity-query.dto';
import { LookupTrolleyUseCase } from '../use-cases/lookup-trolley.use-case';
import { LookupLocationUseCase } from '../use-cases/lookup-location.use-case';
import { CreateTrolleyActivityUseCase } from '../use-cases/create-trolley-activity.use-case';
import { GetTrolleyActivitiesUseCase } from '../use-cases/get-trolley-activities.use-case';
import { GetTrolleyActivitySequenceUseCase } from '../use-cases/get-trolley-activity-sequence.use-case';
import { GetActiveTrolleyActivitiesByRobotUseCase } from '../use-cases/get-active-trolley-activities-by-robot.use-case';

@ApiTags('Trolley Activities')
@ApiBearerAuth('access-token')
@Controller('trolley-activities')
export class TrolleyActivityController {
  constructor(
    private readonly lookupTrolleyUseCase: LookupTrolleyUseCase,
    private readonly lookupLocationUseCase: LookupLocationUseCase,
    private readonly createTrolleyActivityUseCase: CreateTrolleyActivityUseCase,
    private readonly getTrolleyActivitiesUseCase: GetTrolleyActivitiesUseCase,
    private readonly getTrolleyActivitySequenceUseCase: GetTrolleyActivitySequenceUseCase,
    private readonly getActiveTrolleyActivitiesByRobotUseCase: GetActiveTrolleyActivitiesByRobotUseCase,
  ) {}

  @Post('lookup-trolley')
  @Permissions('trolley-activity.create')
  @ApiOperation({ summary: 'Resolve a scanned Trolley code — first scan of the flow' })
  async lookupTrolley(
    @Body() dto: LookupTrolleyDto,
    @CurrentUser() user: AuthRequestUser,
  ) {
    const data = await this.lookupTrolleyUseCase.execute(dto, user.userId);
    return { success: true, message: 'Trolley resolved successfully', data };
  }

  @Post('lookup-location')
  @Permissions('trolley-activity.create')
  @ApiOperation({ summary: 'Resolve a scanned Location code — second scan of the flow' })
  async lookupLocation(@Body() dto: LookupLocationDto) {
    const data = await this.lookupLocationUseCase.execute(dto);
    return { success: true, message: 'Location resolved successfully', data };
  }

  @Post()
  @Permissions('trolley-activity.create')
  @ApiOperation({
    summary:
      'Submit a Trolley Activity — flips the trolley status, records the activity, and forwards a task order to RCS',
  })
  async create(
    @Body() dto: CreateTrolleyActivityDto,
    @CurrentUser() user: AuthRequestUser,
  ) {
    const data = await this.createTrolleyActivityUseCase.execute(dto, user.userId);
    return { success: true, message: 'Trolley Activity submitted successfully', data };
  }

  @Get()
  @Permissions('trolley-activity.read')
  @ApiOperation({ summary: 'List trolley activities (pagination)' })
  async findAll(@Query() query: TrolleyActivityQueryDto) {
    const data = await this.getTrolleyActivitiesUseCase.execute(query);
    return { success: true, message: 'Trolley Activities retrieved successfully', data };
  }

  @Get('active-by-robot')
  @Permissions('trolley-activity.read')
  @ApiOperation({
    summary:
      'Robots currently executing a Trolley Task (PENDING/IN_PROGRESS) and what they\'re carrying right now — powers the Factory Map robot marker',
  })
  async activeByRobot() {
    const data = await this.getActiveTrolleyActivitiesByRobotUseCase.execute();
    return { success: true, message: 'Active trolley activities retrieved successfully', data };
  }

  @Get(':id/sequence')
  @Permissions('trolley-activity.read')
  @ApiOperation({ summary: 'This activity\'s sequence number ("No urut") among its user\'s activities' })
  async sequence(@Param('id') id: string) {
    const data = await this.getTrolleyActivitySequenceUseCase.execute(id);
    return { success: true, message: 'Sequence retrieved successfully', data };
  }
}
