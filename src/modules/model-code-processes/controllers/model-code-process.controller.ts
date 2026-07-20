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
import { CreateModelCodeProcessDto } from '../dto/create-model-code-process.dto';
import { ModelCodeProcessQueryDto } from '../dto/model-code-process-query.dto';
import { UpdateModelCodeProcessDto } from '../dto/update-model-code-process.dto';
import { CreateModelCodeProcessUseCase } from '../use-cases/create-model-code-process.use-case';
import { DeleteModelCodeProcessUseCase } from '../use-cases/delete-model-code-process.use-case';
import { GetModelCodeProcessUseCase } from '../use-cases/get-model-code-process.use-case';
import { GetModelCodeProcessesUseCase } from '../use-cases/get-model-code-processes.use-case';
import { UpdateModelCodeProcessUseCase } from '../use-cases/update-model-code-process.use-case';

@ApiTags('Model Code Processes')
@ApiBearerAuth('access-token')
@Controller('model-code-processes')
export class ModelCodeProcessController {
  constructor(
    private readonly createModelCodeProcessUseCase: CreateModelCodeProcessUseCase,
    private readonly getModelCodeProcessesUseCase: GetModelCodeProcessesUseCase,
    private readonly getModelCodeProcessUseCase: GetModelCodeProcessUseCase,
    private readonly updateModelCodeProcessUseCase: UpdateModelCodeProcessUseCase,
    private readonly deleteModelCodeProcessUseCase: DeleteModelCodeProcessUseCase,
  ) {}

  @Post()
  @Permissions('model-code-process.create')
  @ApiOperation({ summary: 'Create a new model code process' })
  async create(@Body() dto: CreateModelCodeProcessDto) {
    const data = await this.createModelCodeProcessUseCase.execute(dto);
    return {
      success: true,
      message: 'Model Code Process created successfully',
      data,
    };
  }

  @Get()
  @Permissions('model-code-process.read')
  @ApiOperation({
    summary: 'List model code processes (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: ModelCodeProcessQueryDto) {
    const data = await this.getModelCodeProcessesUseCase.execute(query);
    return {
      success: true,
      message: 'Model Code Processes retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('model-code-process.read')
  @ApiOperation({ summary: 'Get a model code process by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getModelCodeProcessUseCase.execute(id);
    return {
      success: true,
      message: 'Model Code Process retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('model-code-process.update')
  @ApiOperation({ summary: 'Update a model code process' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModelCodeProcessDto,
  ) {
    const data = await this.updateModelCodeProcessUseCase.execute(id, dto);
    return {
      success: true,
      message: 'Model Code Process updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('model-code-process.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a model code process' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteModelCodeProcessUseCase.execute(id);
    return {
      success: true,
      message: 'Model Code Process deleted successfully',
      data: null,
    };
  }
}
