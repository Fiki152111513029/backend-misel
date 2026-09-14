import {
  BadRequestException,
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
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { WarehouseLocationQueryDto } from '../dto/warehouse-location-query.dto';
import { CreateWarehouseLocationDto } from '../dto/create-warehouse-location.dto';
import { UpdateWarehouseLocationDto } from '../dto/update-warehouse-location.dto';
import { CreateWarehouseLocationUseCase } from '../use-cases/create-warehouse-location.use-case';
import { DeleteWarehouseLocationUseCase } from '../use-cases/delete-warehouse-location.use-case';
import { GetWarehouseLocationUseCase } from '../use-cases/get-warehouse-location.use-case';
import { GetWarehouseLocationsUseCase } from '../use-cases/get-warehouse-locations.use-case';
import { UpdateWarehouseLocationUseCase } from '../use-cases/update-warehouse-location.use-case';
import { ExportWarehouseLocationsUseCase } from '../use-cases/export-warehouse-locations.use-case';
import { ImportWarehouseLocationsUseCase } from '../use-cases/import-warehouse-locations.use-case';

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
    private readonly exportWarehouseLocationsUseCase: ExportWarehouseLocationsUseCase,
    private readonly importWarehouseLocationsUseCase: ImportWarehouseLocationsUseCase,
  ) {}

  // Must come before @Get(':id') — otherwise Nest would treat "export" as
  // a literal :id value here.
  @Get('export')
  @Permissions('warehouse-location.read')
  @ApiOperation({ summary: 'Export all warehouse locations as CSV or XLSX' })
  async export(
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename, contentType } =
      await this.exportWarehouseLocationsUseCase.execute(
        format === 'csv' ? 'csv' : 'xlsx',
      );
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  @Post('import')
  @Permissions('warehouse-location.create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Import warehouse locations from an uploaded CSV or XLSX file — upserts by name',
  })
  async import(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const data = await this.importWarehouseLocationsUseCase.execute(file);
    return { success: true, message: 'Import completed', data };
  }

  @Post()
  @Permissions('warehouse-location.create')
  @ApiOperation({ summary: 'Create a new warehouse location' })
  async create(@Body() dto: CreateWarehouseLocationDto) {
    const data = await this.createWarehouseLocationUseCase.execute(dto);
    return {
      success: true,
      message: 'Warehouse Location created successfully',
      data,
    };
  }

  @Get()
  @Permissions('warehouse-location.read')
  @ApiOperation({
    summary: 'List warehouse locations (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: WarehouseLocationQueryDto) {
    const data = await this.getWarehouseLocationsUseCase.execute(query);
    return {
      success: true,
      message: 'Warehouse Locations retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('warehouse-location.read')
  @ApiOperation({ summary: 'Get a warehouse location by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getWarehouseLocationUseCase.execute(id);
    return {
      success: true,
      message: 'Warehouse Location retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('warehouse-location.update')
  @ApiOperation({ summary: 'Update a warehouse location' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseLocationDto,
  ) {
    const data = await this.updateWarehouseLocationUseCase.execute(id, dto);
    return {
      success: true,
      message: 'Warehouse Location updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('warehouse-location.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a warehouse location' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteWarehouseLocationUseCase.execute(id);
    return {
      success: true,
      message: 'Warehouse Location deleted successfully',
      data: null,
    };
  }
}
