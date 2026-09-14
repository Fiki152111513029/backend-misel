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
import { ParkingAreaQueryDto } from '../dto/parking-area-query.dto';
import { CreateParkingAreaDto } from '../dto/create-parking-area.dto';
import { UpdateParkingAreaDto } from '../dto/update-parking-area.dto';
import { CreateParkingAreaUseCase } from '../use-cases/create-parking-area.use-case';
import { DeleteParkingAreaUseCase } from '../use-cases/delete-parking-area.use-case';
import { GetParkingAreaUseCase } from '../use-cases/get-parking-area.use-case';
import { GetParkingAreasUseCase } from '../use-cases/get-parking-areas.use-case';
import { UpdateParkingAreaUseCase } from '../use-cases/update-parking-area.use-case';
import { ExportParkingAreasUseCase } from '../use-cases/export-parking-areas.use-case';
import { ImportParkingAreasUseCase } from '../use-cases/import-parking-areas.use-case';

@ApiTags('Parking Areas')
@ApiBearerAuth('access-token')
@Controller('parking-areas')
export class ParkingAreaController {
  constructor(
    private readonly createParkingAreaUseCase: CreateParkingAreaUseCase,
    private readonly getParkingAreasUseCase: GetParkingAreasUseCase,
    private readonly getParkingAreaUseCase: GetParkingAreaUseCase,
    private readonly updateParkingAreaUseCase: UpdateParkingAreaUseCase,
    private readonly deleteParkingAreaUseCase: DeleteParkingAreaUseCase,
    private readonly exportParkingAreasUseCase: ExportParkingAreasUseCase,
    private readonly importParkingAreasUseCase: ImportParkingAreasUseCase,
  ) {}

  // Must come before @Get(':id') — otherwise Nest would treat "export" as
  // a literal :id value here.
  @Get('export')
  @Permissions('parking-area.read')
  @ApiOperation({ summary: 'Export all parking areas as CSV or XLSX' })
  async export(
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename, contentType } =
      await this.exportParkingAreasUseCase.execute(
        format === 'csv' ? 'csv' : 'xlsx',
      );
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  @Post('import')
  @Permissions('parking-area.create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Import parking areas from an uploaded CSV or XLSX file — upserts by name',
  })
  async import(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const data = await this.importParkingAreasUseCase.execute(file);
    return { success: true, message: 'Import completed', data };
  }

  @Post()
  @Permissions('parking-area.create')
  @ApiOperation({ summary: 'Create a new parking area' })
  async create(@Body() dto: CreateParkingAreaDto) {
    const data = await this.createParkingAreaUseCase.execute(dto);
    return {
      success: true,
      message: 'Parking Area created successfully',
      data,
    };
  }

  @Get()
  @Permissions('parking-area.read')
  @ApiOperation({
    summary: 'List parking areas (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: ParkingAreaQueryDto) {
    const data = await this.getParkingAreasUseCase.execute(query);
    return {
      success: true,
      message: 'Parking Areas retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('parking-area.read')
  @ApiOperation({ summary: 'Get a parking area by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getParkingAreaUseCase.execute(id);
    return {
      success: true,
      message: 'Parking Area retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('parking-area.update')
  @ApiOperation({ summary: 'Update a parking area' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParkingAreaDto,
  ) {
    const data = await this.updateParkingAreaUseCase.execute(id, dto);
    return {
      success: true,
      message: 'Parking Area updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('parking-area.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a parking area' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteParkingAreaUseCase.execute(id);
    return {
      success: true,
      message: 'Parking Area deleted successfully',
      data: null,
    };
  }
}
