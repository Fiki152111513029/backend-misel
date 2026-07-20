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
import { CreateEximLocationDto } from '../dto/create-exim-location.dto';
import { EximLocationQueryDto } from '../dto/exim-location-query.dto';
import { UpdateEximLocationDto } from '../dto/update-exim-location.dto';
import { CreateEximLocationUseCase } from '../use-cases/create-exim-location.use-case';
import { DeleteEximLocationUseCase } from '../use-cases/delete-exim-location.use-case';
import { GetEximLocationUseCase } from '../use-cases/get-exim-location.use-case';
import { GetEximLocationsUseCase } from '../use-cases/get-exim-locations.use-case';
import { UpdateEximLocationUseCase } from '../use-cases/update-exim-location.use-case';

@ApiTags('EXIM Locations')
@ApiBearerAuth('access-token')
@Controller('exim-locations')
export class EximLocationController {
  constructor(
    private readonly createEximLocationUseCase: CreateEximLocationUseCase,
    private readonly getEximLocationsUseCase: GetEximLocationsUseCase,
    private readonly getEximLocationUseCase: GetEximLocationUseCase,
    private readonly updateEximLocationUseCase: UpdateEximLocationUseCase,
    private readonly deleteEximLocationUseCase: DeleteEximLocationUseCase,
  ) {}

  @Post()
  @Permissions('exim-location.create')
  @ApiOperation({ summary: 'Create a new EXIM location' })
  async create(@Body() dto: CreateEximLocationDto) {
    const data = await this.createEximLocationUseCase.execute(dto);
    return {
      success: true,
      message: 'EXIM Location created successfully',
      data,
    };
  }

  @Get()
  @Permissions('exim-location.read')
  @ApiOperation({
    summary: 'List EXIM locations (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: EximLocationQueryDto) {
    const data = await this.getEximLocationsUseCase.execute(query);
    return {
      success: true,
      message: 'EXIM Locations retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('exim-location.read')
  @ApiOperation({ summary: 'Get an EXIM location by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getEximLocationUseCase.execute(id);
    return {
      success: true,
      message: 'EXIM Location retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('exim-location.update')
  @ApiOperation({ summary: 'Update an EXIM location' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEximLocationDto,
  ) {
    const data = await this.updateEximLocationUseCase.execute(id, dto);
    return {
      success: true,
      message: 'EXIM Location updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('exim-location.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete an EXIM location' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteEximLocationUseCase.execute(id);
    return {
      success: true,
      message: 'EXIM Location deleted successfully',
      data: null,
    };
  }
}
