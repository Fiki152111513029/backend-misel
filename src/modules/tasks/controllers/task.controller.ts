import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthRequestUser } from '../../auth/types/auth-request-user.type';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ReleaseTaskDto } from '../dto/release-task.dto';
import { TaskQueryDto } from '../dto/task-query.dto';
import { GetTasksUseCase } from '../use-cases/get-tasks.use-case';
import { ReleaseTaskUseCase } from '../use-cases/release-task.use-case';

@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly releaseTaskUseCase: ReleaseTaskUseCase,
    private readonly getTasksUseCase: GetTasksUseCase,
  ) {}

  @Post('release')
  @Permissions('task.create')
  @ApiOperation({
    summary: 'Release a task to the AMR fleet for the current operator\'s production line',
  })
  async release(
    @Body() dto: ReleaseTaskDto,
    @CurrentUser() user: AuthRequestUser,
  ) {
    const data = await this.releaseTaskUseCase.execute(
      dto,
      user.userId,
      user.role,
    );
    return {
      success: true,
      message: 'Task released successfully',
      data,
    };
  }

  @Get()
  @Permissions('task.read')
  @ApiOperation({ summary: 'List tasks (pagination, sorting)' })
  async findAll(@Query() query: TaskQueryDto) {
    const data = await this.getTasksUseCase.execute(query);
    return {
      success: true,
      message: 'Tasks retrieved successfully',
      data,
    };
  }
}
