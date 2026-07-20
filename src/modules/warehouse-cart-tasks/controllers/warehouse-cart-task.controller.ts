import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthRequestUser } from '../../auth/types/auth-request-user.type';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ReleaseWarehouseCartTaskDto } from '../dto/release-warehouse-cart-task.dto';
import { WarehouseCartTaskQueryDto } from '../dto/warehouse-cart-task-query.dto';
import { GetWarehouseCartTasksUseCase } from '../use-cases/get-warehouse-cart-tasks.use-case';
import { ReleaseWarehouseCartTaskUseCase } from '../use-cases/release-warehouse-cart-task.use-case';

@ApiTags('Warehouse Cart Tasks')
@ApiBearerAuth('access-token')
@Controller('warehouse-cart-tasks')
export class WarehouseCartTaskController {
  constructor(
    private readonly releaseWarehouseCartTaskUseCase: ReleaseWarehouseCartTaskUseCase,
    private readonly getWarehouseCartTasksUseCase: GetWarehouseCartTasksUseCase,
  ) {}

  @Post('release')
  @Permissions('warehouse-cart-task.create')
  @ApiOperation({
    summary:
      "Release a cart task to the AMR fleet for the current operator's Warehouse Line Location",
  })
  async release(
    @Body() dto: ReleaseWarehouseCartTaskDto,
    @CurrentUser() user: AuthRequestUser,
  ) {
    const data = await this.releaseWarehouseCartTaskUseCase.execute(
      dto,
      user.userId,
    );
    return {
      success: true,
      message: 'Warehouse cart task released successfully',
      data,
    };
  }

  @Get()
  @Permissions('warehouse-cart-task.read')
  @ApiOperation({ summary: 'List warehouse cart tasks (pagination, sorting)' })
  async findAll(@Query() query: WarehouseCartTaskQueryDto) {
    const data = await this.getWarehouseCartTasksUseCase.execute(query);
    return {
      success: true,
      message: 'Warehouse cart tasks retrieved successfully',
      data,
    };
  }
}
