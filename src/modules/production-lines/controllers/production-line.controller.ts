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
import { CreateProductionLineDto } from '../dto/create-production-line.dto';
import { ProductionLineQueryDto } from '../dto/production-line-query.dto';
import { UpdateProductionLineDto } from '../dto/update-production-line.dto';
import { CreateProductionLineUseCase } from '../use-cases/create-production-line.use-case';
import { DeleteProductionLineUseCase } from '../use-cases/delete-production-line.use-case';
import { GetProductionLineUseCase } from '../use-cases/get-production-line.use-case';
import { GetProductionLinesUseCase } from '../use-cases/get-production-lines.use-case';
import { UpdateProductionLineUseCase } from '../use-cases/update-production-line.use-case';

@ApiTags('Production Lines')
@ApiBearerAuth('access-token')
@Controller('production-lines')
export class ProductionLineController {
  constructor(
    private readonly createProductionLineUseCase: CreateProductionLineUseCase,
    private readonly getProductionLinesUseCase: GetProductionLinesUseCase,
    private readonly getProductionLineUseCase: GetProductionLineUseCase,
    private readonly updateProductionLineUseCase: UpdateProductionLineUseCase,
    private readonly deleteProductionLineUseCase: DeleteProductionLineUseCase,
  ) {}

  @Post()
  @Permissions('production-line.create')
  @ApiOperation({ summary: 'Create a new production line' })
  async create(@Body() dto: CreateProductionLineDto) {
    const data = await this.createProductionLineUseCase.execute(dto);
    return {
      success: true,
      message: 'Production Line created successfully',
      data,
    };
  }

  @Get()
  @Permissions('production-line.read')
  @ApiOperation({
    summary: 'List production lines (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: ProductionLineQueryDto) {
    const data = await this.getProductionLinesUseCase.execute(query);
    return {
      success: true,
      message: 'Production Lines retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('production-line.read')
  @ApiOperation({ summary: 'Get a production line by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getProductionLineUseCase.execute(id);
    return {
      success: true,
      message: 'Production Line retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('production-line.update')
  @ApiOperation({ summary: 'Update a production line' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductionLineDto,
  ) {
    const data = await this.updateProductionLineUseCase.execute(id, dto);
    return {
      success: true,
      message: 'Production Line updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('production-line.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a production line' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteProductionLineUseCase.execute(id);
    return {
      success: true,
      message: 'Production Line deleted successfully',
      data: null,
    };
  }
}
