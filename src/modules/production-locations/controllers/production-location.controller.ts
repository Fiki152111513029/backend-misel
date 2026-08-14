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
import { ProductionLocationQueryDto } from '../dto/production-location-query.dto';
import { CreateProductionLocationDto } from '../dto/create-production-location.dto';
import { UpdateProductionLocationDto } from '../dto/update-production-location.dto';
import { CreateProductionLocationUseCase } from '../use-cases/create-production-location.use-case';
import { DeleteProductionLocationUseCase } from '../use-cases/delete-production-location.use-case';
import { GetProductionLocationUseCase } from '../use-cases/get-production-location.use-case';
import { GetProductionLocationsUseCase } from '../use-cases/get-production-locations.use-case';
import { UpdateProductionLocationUseCase } from '../use-cases/update-production-location.use-case';

@ApiTags('Production Locations')
@ApiBearerAuth('access-token')
@Controller('production-locations')
export class ProductionLocationController {
  constructor(
    private readonly createProductionLocationUseCase: CreateProductionLocationUseCase,
    private readonly getProductionLocationsUseCase: GetProductionLocationsUseCase,
    private readonly getProductionLocationUseCase: GetProductionLocationUseCase,
    private readonly updateProductionLocationUseCase: UpdateProductionLocationUseCase,
    private readonly deleteProductionLocationUseCase: DeleteProductionLocationUseCase,
  ) {}

  @Post()
  @Permissions('production-location.create')
  @ApiOperation({ summary: 'Create a new production location' })
  async create(@Body() dto: CreateProductionLocationDto) {
    const data = await this.createProductionLocationUseCase.execute(dto);
    return { success: true, message: 'Production Location created successfully', data };
  }

  @Get()
  @Permissions('production-location.read')
  @ApiOperation({
    summary: 'List production locations (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: ProductionLocationQueryDto) {
    const data = await this.getProductionLocationsUseCase.execute(query);
    return { success: true, message: 'Production Locations retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('production-location.read')
  @ApiOperation({ summary: 'Get a production location by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getProductionLocationUseCase.execute(id);
    return { success: true, message: 'Production Location retrieved successfully', data };
  }

  @Put(':id')
  @Permissions('production-location.update')
  @ApiOperation({ summary: 'Update a production location' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductionLocationDto,
  ) {
    const data = await this.updateProductionLocationUseCase.execute(id, dto);
    return { success: true, message: 'Production Location updated successfully', data };
  }

  @Delete(':id')
  @Permissions('production-location.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a production location' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteProductionLocationUseCase.execute(id);
    return { success: true, message: 'Production Location deleted successfully', data: null };
  }
}
