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
import { CreateQuarantineAreaDto } from '../dto/create-quarantine-area.dto';
import { QuarantineAreaQueryDto } from '../dto/quarantine-area-query.dto';
import { UpdateQuarantineAreaDto } from '../dto/update-quarantine-area.dto';
import { CreateQuarantineAreaUseCase } from '../use-cases/create-quarantine-area.use-case';
import { DeleteQuarantineAreaUseCase } from '../use-cases/delete-quarantine-area.use-case';
import { GetQuarantineAreaUseCase } from '../use-cases/get-quarantine-area.use-case';
import { GetQuarantineAreasUseCase } from '../use-cases/get-quarantine-areas.use-case';
import { UpdateQuarantineAreaUseCase } from '../use-cases/update-quarantine-area.use-case';

@ApiTags('Quarantine Areas')
@ApiBearerAuth('access-token')
@Controller('quarantine-areas')
export class QuarantineAreaController {
  constructor(
    private readonly createQuarantineAreaUseCase: CreateQuarantineAreaUseCase,
    private readonly getQuarantineAreasUseCase: GetQuarantineAreasUseCase,
    private readonly getQuarantineAreaUseCase: GetQuarantineAreaUseCase,
    private readonly updateQuarantineAreaUseCase: UpdateQuarantineAreaUseCase,
    private readonly deleteQuarantineAreaUseCase: DeleteQuarantineAreaUseCase,
  ) {}

  @Post()
  @Permissions('quarantine-area.create')
  @ApiOperation({ summary: 'Create a new quarantine area' })
  async create(@Body() dto: CreateQuarantineAreaDto) {
    const data = await this.createQuarantineAreaUseCase.execute(dto);
    return {
      success: true,
      message: 'Quarantine Area created successfully',
      data,
    };
  }

  @Get()
  @Permissions('quarantine-area.read')
  @ApiOperation({
    summary: 'List quarantine areas (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: QuarantineAreaQueryDto) {
    const data = await this.getQuarantineAreasUseCase.execute(query);
    return {
      success: true,
      message: 'Quarantine Areas retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('quarantine-area.read')
  @ApiOperation({ summary: 'Get a quarantine area by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getQuarantineAreaUseCase.execute(id);
    return {
      success: true,
      message: 'Quarantine Area retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('quarantine-area.update')
  @ApiOperation({ summary: 'Update a quarantine area' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuarantineAreaDto,
  ) {
    const data = await this.updateQuarantineAreaUseCase.execute(id, dto);
    return {
      success: true,
      message: 'Quarantine Area updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('quarantine-area.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a quarantine area' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteQuarantineAreaUseCase.execute(id);
    return {
      success: true,
      message: 'Quarantine Area deleted successfully',
      data: null,
    };
  }
}
