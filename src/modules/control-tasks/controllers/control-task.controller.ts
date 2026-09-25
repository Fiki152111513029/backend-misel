import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ControlTaskQueryDto } from '../dto/control-task-query.dto';
import { CreateControlTaskDto } from '../dto/create-control-task.dto';
import { UpdateControlTaskDto } from '../dto/update-control-task.dto';
import { CreateControlTaskUseCase } from '../use-cases/create-control-task.use-case';
import { DeleteControlTaskUseCase } from '../use-cases/delete-control-task.use-case';
import { GetControlTaskByAbjadUseCase } from '../use-cases/get-control-task-by-abjad.use-case';
import { GetControlTaskUseCase } from '../use-cases/get-control-task.use-case';
import { GetControlTasksUseCase } from '../use-cases/get-control-tasks.use-case';
import { GetRouteOptionsUseCase } from '../use-cases/get-route-options.use-case';
import { UpdateControlTaskUseCase } from '../use-cases/update-control-task.use-case';

@ApiTags('Control Tasks')
@ApiBearerAuth('access-token')
@Controller('control-tasks')
export class ControlTaskController {
  constructor(
    private readonly createControlTaskUseCase: CreateControlTaskUseCase,
    private readonly getControlTasksUseCase: GetControlTasksUseCase,
    private readonly getControlTaskUseCase: GetControlTaskUseCase,
    private readonly getControlTaskByAbjadUseCase: GetControlTaskByAbjadUseCase,
    private readonly getRouteOptionsUseCase: GetRouteOptionsUseCase,
    private readonly updateControlTaskUseCase: UpdateControlTaskUseCase,
    private readonly deleteControlTaskUseCase: DeleteControlTaskUseCase,
  ) {}

  // Both literal routes must come before the :id route below — otherwise
  // Nest would match route-options / by-abjad as an id value here.
  @Get('route-options')
  @Permissions('control-task.read')
  @ApiOperation({
    summary:
      'iRayple Location Codes a route can be built from (Production + Warehouse)',
  })
  async routeOptions() {
    const data = await this.getRouteOptionsUseCase.execute();
    return {
      success: true,
      message: 'Route options retrieved successfully',
      data,
    };
  }

  @Get('by-abjad/:abjad')
  @Permissions('control-task.read')
  @ApiOperation({ summary: 'Get a control task by the abjad on its QR label' })
  async findByAbjad(@Param('abjad') abjad: string) {
    const data = await this.getControlTaskByAbjadUseCase.execute(abjad);
    return {
      success: true,
      message: 'Control Task retrieved successfully',
      data,
    };
  }

  @Post()
  @Permissions('control-task.create')
  @ApiOperation({ summary: 'Create a new control task' })
  async create(@Body() dto: CreateControlTaskDto) {
    const data = await this.createControlTaskUseCase.execute(dto);
    return {
      success: true,
      message: 'Control Task created successfully',
      data,
    };
  }

  @Get()
  @Permissions('control-task.read')
  @ApiOperation({
    summary: 'List control tasks (pagination, search, filter by type of goods)',
  })
  async findAll(@Query() query: ControlTaskQueryDto) {
    const data = await this.getControlTasksUseCase.execute(query);
    return {
      success: true,
      message: 'Control Tasks retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('control-task.read')
  @ApiOperation({ summary: 'Get a control task by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getControlTaskUseCase.execute(id);
    return {
      success: true,
      message: 'Control Task retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('control-task.update')
  @ApiOperation({ summary: 'Update a control task' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateControlTaskDto,
  ) {
    const data = await this.updateControlTaskUseCase.execute(id, dto);
    return {
      success: true,
      message: 'Control Task updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('control-task.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a control task' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteControlTaskUseCase.execute(id);
    return {
      success: true,
      message: 'Control Task deleted successfully',
      data: null,
    };
  }
}
