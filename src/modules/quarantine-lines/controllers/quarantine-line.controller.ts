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
import { CreateQuarantineLineDto } from '../dto/create-quarantine-line.dto';
import { QuarantineLineQueryDto } from '../dto/quarantine-line-query.dto';
import { UpdateQuarantineLineDto } from '../dto/update-quarantine-line.dto';
import { CreateQuarantineLineUseCase } from '../use-cases/create-quarantine-line.use-case';
import { DeleteQuarantineLineUseCase } from '../use-cases/delete-quarantine-line.use-case';
import { GetQuarantineLineUseCase } from '../use-cases/get-quarantine-line.use-case';
import { GetQuarantineLinesUseCase } from '../use-cases/get-quarantine-lines.use-case';
import { UpdateQuarantineLineUseCase } from '../use-cases/update-quarantine-line.use-case';

@ApiTags('Quarantine Lines')
@ApiBearerAuth('access-token')
@Controller('quarantine-lines')
export class QuarantineLineController {
  constructor(
    private readonly createQuarantineLineUseCase: CreateQuarantineLineUseCase,
    private readonly getQuarantineLinesUseCase: GetQuarantineLinesUseCase,
    private readonly getQuarantineLineUseCase: GetQuarantineLineUseCase,
    private readonly updateQuarantineLineUseCase: UpdateQuarantineLineUseCase,
    private readonly deleteQuarantineLineUseCase: DeleteQuarantineLineUseCase,
  ) {}

  @Post()
  @Permissions('quarantine-line.create')
  @ApiOperation({ summary: 'Create a new quarantine line' })
  async create(@Body() dto: CreateQuarantineLineDto) {
    const data = await this.createQuarantineLineUseCase.execute(dto);
    return {
      success: true,
      message: 'Quarantine Line created successfully',
      data,
    };
  }

  @Get()
  @Permissions('quarantine-line.read')
  @ApiOperation({
    summary: 'List quarantine lines (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: QuarantineLineQueryDto) {
    const data = await this.getQuarantineLinesUseCase.execute(query);
    return {
      success: true,
      message: 'Quarantine Lines retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('quarantine-line.read')
  @ApiOperation({ summary: 'Get a quarantine line by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getQuarantineLineUseCase.execute(id);
    return {
      success: true,
      message: 'Quarantine Line retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('quarantine-line.update')
  @ApiOperation({ summary: 'Update a quarantine line' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuarantineLineDto,
  ) {
    const data = await this.updateQuarantineLineUseCase.execute(id, dto);
    return {
      success: true,
      message: 'Quarantine Line updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('quarantine-line.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a quarantine line' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteQuarantineLineUseCase.execute(id);
    return {
      success: true,
      message: 'Quarantine Line deleted successfully',
      data: null,
    };
  }
}
