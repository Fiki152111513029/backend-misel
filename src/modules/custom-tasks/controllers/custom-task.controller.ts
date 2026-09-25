import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ReleaseCustomTaskDto } from '../dto/release-custom-task.dto';
import { LookupCustomTaskUseCase } from '../use-cases/lookup-custom-task.use-case';
import { ReleaseCustomTaskUseCase } from '../use-cases/release-custom-task.use-case';

@ApiTags('Custom Tasks')
@ApiBearerAuth('access-token')
@Controller('custom-tasks')
export class CustomTaskController {
  constructor(
    private readonly lookupCustomTaskUseCase: LookupCustomTaskUseCase,
    private readonly releaseCustomTaskUseCase: ReleaseCustomTaskUseCase,
  ) {}

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
  async release(@Body() dto: ReleaseCustomTaskDto) {
    const data = await this.releaseCustomTaskUseCase.execute(dto.abjad);
    return { success: true, message: 'Custom Task submitted', data };
  }
}
