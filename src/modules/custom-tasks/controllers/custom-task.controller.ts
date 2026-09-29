import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthRequestUser } from '../../auth/types/auth-request-user.type';
import { CustomTaskRunQueryDto } from '../dto/custom-task-run-query.dto';
import { ReleaseCustomTaskDto } from '../dto/release-custom-task.dto';
import { GetCustomTaskRunsUseCase } from '../use-cases/get-custom-task-runs.use-case';
import { LookupCustomTaskUseCase } from '../use-cases/lookup-custom-task.use-case';
import { ReleaseCustomTaskUseCase } from '../use-cases/release-custom-task.use-case';

@ApiTags('Custom Tasks')
@ApiBearerAuth('access-token')
@Controller('custom-tasks')
export class CustomTaskController {
  constructor(
    private readonly lookupCustomTaskUseCase: LookupCustomTaskUseCase,
    private readonly releaseCustomTaskUseCase: ReleaseCustomTaskUseCase,
    private readonly getCustomTaskRunsUseCase: GetCustomTaskRunsUseCase,
  ) {}

  @Get('runs')
  @Permissions('custom-task.read')
  @ApiOperation({
    summary:
      'History of Custom Tasks actually sent to RCS, newest first, with their live status (page, limit, search, status, date, sortBy, sortOrder) — the All Tasks > Custom Tasks page',
  })
  async runs(@Query() query: CustomTaskRunQueryDto) {
    const data = await this.getCustomTaskRunsUseCase.execute(query);
    return {
      success: true,
      message: 'Custom Task runs retrieved successfully',
      data,
    };
  }

  @Get('lookup/:abjad')
  @Permissions('custom-task.read')
  @ApiOperation({
    summary:
      'Resolve a scanned abjad into the task order that would be sent (read-only)',
  })
  async lookup(@Param('abjad') abjad: string) {
    const data = await this.lookupCustomTaskUseCase.execute(abjad);
    return {
      success: true,
      message: 'Custom Task retrieved successfully',
      data,
    };
  }

  @Post('release')
  @Permissions('custom-task.create')
  @ApiOperation({
    summary: 'Send the scanned Control Task to RCS as a task order',
  })
  async release(
    @Body() dto: ReleaseCustomTaskDto,
    @CurrentUser() user: AuthRequestUser,
  ) {
    const data = await this.releaseCustomTaskUseCase.execute(
      dto.abjad,
      user.userId,
    );
    return { success: true, message: 'Custom Task submitted', data };
  }
}
