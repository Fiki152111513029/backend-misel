import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CreateProductionLineAreaDto } from '../dto/create-production-line-area.dto';
import { ProductionLineAreaQueryDto } from '../dto/production-line-area-query.dto';
import { ReorderProductionLineAreasDto } from '../dto/reorder-production-line-areas.dto';
import { UpdateProductionLineAreaDto } from '../dto/update-production-line-area.dto';
import { CreateProductionLineAreaUseCase } from '../use-cases/create-production-line-area.use-case';
import { DeleteProductionLineAreaUseCase } from '../use-cases/delete-production-line-area.use-case';
import { GetProductionLineAreaUseCase } from '../use-cases/get-production-line-area.use-case';
import { GetProductionLineAreasUseCase } from '../use-cases/get-production-line-areas.use-case';
import { ReorderProductionLineAreasUseCase } from '../use-cases/reorder-production-line-areas.use-case';
import { UpdateProductionLineAreaUseCase } from '../use-cases/update-production-line-area.use-case';

@ApiTags('Production Line Areas')
@ApiBearerAuth('access-token')
@Controller('production-line-areas')
export class ProductionLineAreaController {
  constructor(
    private readonly createProductionLineAreaUseCase: CreateProductionLineAreaUseCase,
    private readonly getProductionLineAreasUseCase: GetProductionLineAreasUseCase,
    private readonly getProductionLineAreaUseCase: GetProductionLineAreaUseCase,
    private readonly updateProductionLineAreaUseCase: UpdateProductionLineAreaUseCase,
    private readonly deleteProductionLineAreaUseCase: DeleteProductionLineAreaUseCase,
    private readonly reorderProductionLineAreasUseCase: ReorderProductionLineAreasUseCase,
  ) {}

  @Post()
  @Permissions('production-line-area.create')
  @ApiOperation({ summary: 'Create a new production line area' })
  async create(@Body() dto: CreateProductionLineAreaDto) {
    const data = await this.createProductionLineAreaUseCase.execute(dto);
    return {
      success: true,
      message: 'Production Line Area created successfully',
      data,
    };
  }

  @Get()
  @Permissions('production-line-area.read')
  @ApiOperation({
    summary: 'List production line areas (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: ProductionLineAreaQueryDto) {
    const data = await this.getProductionLineAreasUseCase.execute(query);
    return {
      success: true,
      message: 'Production Line Areas retrieved successfully',
      data,
    };
  }

  @Patch('reorder')
  @Permissions('production-line-area.update')
  @ApiOperation({ summary: 'Reorder production line areas' })
  async reorder(@Body() dto: ReorderProductionLineAreasDto) {
    await this.reorderProductionLineAreasUseCase.execute(dto);
    return {
      success: true,
      message: 'Production Line Areas reordered successfully',
      data: null,
    };
  }

  @Get(':id')
  @Permissions('production-line-area.read')
  @ApiOperation({ summary: 'Get a production line area by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getProductionLineAreaUseCase.execute(id);
    return {
      success: true,
      message: 'Production Line Area retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('production-line-area.update')
  @ApiOperation({ summary: 'Update a production line area' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductionLineAreaDto,
  ) {
    const data = await this.updateProductionLineAreaUseCase.execute(id, dto);
    return {
      success: true,
      message: 'Production Line Area updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('production-line-area.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a production line area' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteProductionLineAreaUseCase.execute(id);
    return {
      success: true,
      message: 'Production Line Area deleted successfully',
      data: null,
    };
  }
}
