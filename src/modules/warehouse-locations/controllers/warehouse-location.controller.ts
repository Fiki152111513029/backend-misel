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
import { WarehouseLocationQueryDto } from '../dto/warehouse-location-query.dto';
import { CreateWarehouseLocationDto } from '../dto/create-warehouse-location.dto';
import { UpdateWarehouseLocationDto } from '../dto/update-warehouse-location.dto';
import { CreateWarehouseLocationUseCase } from '../use-cases/create-warehouse-location.use-case';
import { DeleteWarehouseLocationUseCase } from '../use-cases/delete-warehouse-location.use-case';
import { GetWarehouseLocationUseCase } from '../use-cases/get-warehouse-location.use-case';
import { GetWarehouseLocationsUseCase } from '../use-cases/get-warehouse-locations.use-case';
import { UpdateWarehouseLocationUseCase } from '../use-cases/update-warehouse-location.use-case';

@ApiTags('Warehouse Locations')
@ApiBearerAuth('access-token')
@Controller('warehouse-locations')
export class WarehouseLocationController {
  constructor(
    private readonly createWarehouseLocationUseCase: CreateWarehouseLocationUseCase,
    private readonly getWarehouseLocationsUseCase: GetWarehouseLocationsUseCase,
    private readonly getWarehouseLocationUseCase: GetWarehouseLocationUseCase,
    private readonly updateWarehouseLocationUseCase: UpdateWarehouseLocationUseCase,
    private readonly deleteWarehouseLocationUseCase: DeleteWarehouseLocationUseCase,
  ) {}

  @Post()
  @Permissions('warehouse-location.create')
  @ApiOperation({ summary: 'Create a new warehouse location' })
  async create(@Body() dto: CreateWarehouseLocationDto) {
    const data = await this.createWarehouseLocationUseCase.execute(dto);
    return { success: true, message: 'Warehouse Location created successfully', data };
  }

  @Get()
  @Permissions('warehouse-location.read')
  @ApiOperation({
    summary: 'List warehouse locations (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: WarehouseLocationQueryDto) {
    const data = await this.getWarehouseLocationsUseCase.execute(query);
    return { success: true, message: 'Warehouse Locations retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('warehouse-location.read')
  @ApiOperation({ summary: 'Get a warehouse location by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getWarehouseLocationUseCase.execute(id);
    return { success: true, message: 'Warehouse Location retrieved successfully', data };
  }

  @Put(':id')
  @Permissions('warehouse-location.update')
  @ApiOperation({ summary: 'Update a warehouse location' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseLocationDto,
  ) {
    const data = await this.updateWarehouseLocationUseCase.execute(id, dto);
    return { success: true, message: 'Warehouse Location updated successfully', data };
  }

  @Delete(':id')
  @Permissions('warehouse-location.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a warehouse location' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteWarehouseLocationUseCase.execute(id);
    return { success: true, message: 'Warehouse Location deleted successfully', data: null };
  }
}
