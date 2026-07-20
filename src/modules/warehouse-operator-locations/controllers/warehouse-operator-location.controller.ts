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
import { AvailableOperatorsQueryDto } from '../dto/available-operators-query.dto';
import { CreateWarehouseOperatorLocationDto } from '../dto/create-warehouse-operator-location.dto';
import { WarehouseOperatorLocationQueryDto } from '../dto/warehouse-operator-location-query.dto';
import { UpdateWarehouseOperatorLocationDto } from '../dto/update-warehouse-operator-location.dto';
import { CreateWarehouseOperatorLocationUseCase } from '../use-cases/create-warehouse-operator-location.use-case';
import { DeleteWarehouseOperatorLocationUseCase } from '../use-cases/delete-warehouse-operator-location.use-case';
import { GetAvailableOperatorsUseCase } from '../use-cases/get-available-operators.use-case';
import { GetWarehouseOperatorLocationUseCase } from '../use-cases/get-warehouse-operator-location.use-case';
import { GetWarehouseOperatorLocationsUseCase } from '../use-cases/get-warehouse-operator-locations.use-case';
import { UpdateWarehouseOperatorLocationUseCase } from '../use-cases/update-warehouse-operator-location.use-case';

@ApiTags('Warehouse Operator Locations')
@ApiBearerAuth('access-token')
@Controller('warehouse-operator-locations')
export class WarehouseOperatorLocationController {
  constructor(
    private readonly createWarehouseOperatorLocationUseCase: CreateWarehouseOperatorLocationUseCase,
    private readonly getWarehouseOperatorLocationsUseCase: GetWarehouseOperatorLocationsUseCase,
    private readonly getWarehouseOperatorLocationUseCase: GetWarehouseOperatorLocationUseCase,
    private readonly updateWarehouseOperatorLocationUseCase: UpdateWarehouseOperatorLocationUseCase,
    private readonly deleteWarehouseOperatorLocationUseCase: DeleteWarehouseOperatorLocationUseCase,
    private readonly getAvailableOperatorsUseCase: GetAvailableOperatorsUseCase,
  ) {}

  @Post()
  @Permissions('warehouse-operator-location.create')
  @ApiOperation({ summary: 'Create a new warehouse operator location' })
  async create(@Body() dto: CreateWarehouseOperatorLocationDto) {
    const data = await this.createWarehouseOperatorLocationUseCase.execute(dto);
    return {
      success: true,
      message: 'Warehouse Operator Location created successfully',
      data,
    };
  }

  @Get()
  @Permissions('warehouse-operator-location.read')
  @ApiOperation({
    summary:
      'List warehouse operator locations (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: WarehouseOperatorLocationQueryDto) {
    const data = await this.getWarehouseOperatorLocationsUseCase.execute(query);
    return {
      success: true,
      message: 'Warehouse Operator Locations retrieved successfully',
      data,
    };
  }

  @Get('available-operators')
  @Permissions('warehouse-operator-location.create')
  @ApiOperation({
    summary:
      'List active users with the Warehouse role that are not yet assigned to a location',
  })
  async findAvailableOperators(@Query() query: AvailableOperatorsQueryDto) {
    const data = await this.getAvailableOperatorsUseCase.execute(
      query.excludeId,
    );
    return {
      success: true,
      message: 'Available operators retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('warehouse-operator-location.read')
  @ApiOperation({ summary: 'Get a warehouse operator location by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getWarehouseOperatorLocationUseCase.execute(id);
    return {
      success: true,
      message: 'Warehouse Operator Location retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('warehouse-operator-location.update')
  @ApiOperation({ summary: 'Update a warehouse operator location' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseOperatorLocationDto,
  ) {
    const data = await this.updateWarehouseOperatorLocationUseCase.execute(
      id,
      dto,
    );
    return {
      success: true,
      message: 'Warehouse Operator Location updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('warehouse-operator-location.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a warehouse operator location' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteWarehouseOperatorLocationUseCase.execute(id);
    return {
      success: true,
      message: 'Warehouse Operator Location deleted successfully',
      data: null,
    };
  }
}
