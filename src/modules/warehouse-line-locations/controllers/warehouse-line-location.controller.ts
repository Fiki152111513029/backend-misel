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
import { CreateWarehouseLineLocationDto } from '../dto/create-warehouse-line-location.dto';
import { WarehouseLineLocationQueryDto } from '../dto/warehouse-line-location-query.dto';
import { UpdateWarehouseLineLocationDto } from '../dto/update-warehouse-line-location.dto';
import { CreateWarehouseLineLocationUseCase } from '../use-cases/create-warehouse-line-location.use-case';
import { DeleteWarehouseLineLocationUseCase } from '../use-cases/delete-warehouse-line-location.use-case';
import { GetWarehouseLineLocationUseCase } from '../use-cases/get-warehouse-line-location.use-case';
import { GetWarehouseLineLocationsUseCase } from '../use-cases/get-warehouse-line-locations.use-case';
import { UpdateWarehouseLineLocationUseCase } from '../use-cases/update-warehouse-line-location.use-case';

@ApiTags('Warehouse Line Locations')
@ApiBearerAuth('access-token')
@Controller('warehouse-line-locations')
export class WarehouseLineLocationController {
  constructor(
    private readonly createWarehouseLineLocationUseCase: CreateWarehouseLineLocationUseCase,
    private readonly getWarehouseLineLocationsUseCase: GetWarehouseLineLocationsUseCase,
    private readonly getWarehouseLineLocationUseCase: GetWarehouseLineLocationUseCase,
    private readonly updateWarehouseLineLocationUseCase: UpdateWarehouseLineLocationUseCase,
    private readonly deleteWarehouseLineLocationUseCase: DeleteWarehouseLineLocationUseCase,
  ) {}

  @Post()
  @Permissions('warehouse-line-location.create')
  @ApiOperation({ summary: 'Create a new warehouse line location' })
  async create(@Body() dto: CreateWarehouseLineLocationDto) {
    const data = await this.createWarehouseLineLocationUseCase.execute(dto);
    return {
      success: true,
      message: 'Warehouse Line Location created successfully',
      data,
    };
  }

  @Get()
  @Permissions('warehouse-line-location.read')
  @ApiOperation({
    summary:
      'List warehouse line locations (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: WarehouseLineLocationQueryDto) {
    const data = await this.getWarehouseLineLocationsUseCase.execute(query);
    return {
      success: true,
      message: 'Warehouse Line Locations retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('warehouse-line-location.read')
  @ApiOperation({ summary: 'Get a warehouse line location by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getWarehouseLineLocationUseCase.execute(id);
    return {
      success: true,
      message: 'Warehouse Line Location retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('warehouse-line-location.update')
  @ApiOperation({ summary: 'Update a warehouse line location' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseLineLocationDto,
  ) {
    const data = await this.updateWarehouseLineLocationUseCase.execute(id, dto);
    return {
      success: true,
      message: 'Warehouse Line Location updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('warehouse-line-location.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a warehouse line location' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteWarehouseLineLocationUseCase.execute(id);
    return {
      success: true,
      message: 'Warehouse Line Location deleted successfully',
      data: null,
    };
  }
}
