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
import { ChargerAreaQueryDto } from '../dto/charger-area-query.dto';
import { CreateChargerAreaDto } from '../dto/create-charger-area.dto';
import { UpdateChargerAreaDto } from '../dto/update-charger-area.dto';
import { CreateChargerAreaUseCase } from '../use-cases/create-charger-area.use-case';
import { DeleteChargerAreaUseCase } from '../use-cases/delete-charger-area.use-case';
import { GetChargerAreaUseCase } from '../use-cases/get-charger-area.use-case';
import { GetChargerAreasUseCase } from '../use-cases/get-charger-areas.use-case';
import { UpdateChargerAreaUseCase } from '../use-cases/update-charger-area.use-case';
import { ExportChargerAreasUseCase } from '../use-cases/export-charger-areas.use-case';
import { ImportChargerAreasUseCase } from '../use-cases/import-charger-areas.use-case';

@ApiTags('Charger Areas')
@ApiBearerAuth('access-token')
@Controller('charger-areas')
export class ChargerAreaController {
  constructor(
    private readonly createChargerAreaUseCase: CreateChargerAreaUseCase,
    private readonly getChargerAreasUseCase: GetChargerAreasUseCase,
    private readonly getChargerAreaUseCase: GetChargerAreaUseCase,
    private readonly updateChargerAreaUseCase: UpdateChargerAreaUseCase,
    private readonly deleteChargerAreaUseCase: DeleteChargerAreaUseCase,
    private readonly exportChargerAreasUseCase: ExportChargerAreasUseCase,
    private readonly importChargerAreasUseCase: ImportChargerAreasUseCase,
  ) {}

  // Must come before @Get(':id') — otherwise Nest would treat "export" as
  // a literal :id value here.
  @Get('export')
  @Permissions('charger-area.read')
  @ApiOperation({ summary: 'Export all charger areas as CSV or XLSX' })
  async export(
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename, contentType } =
      await this.exportChargerAreasUseCase.execute(
        format === 'csv' ? 'csv' : 'xlsx',
      );
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  @Post('import')
  @Permissions('charger-area.create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Import charger areas from an uploaded CSV or XLSX file — upserts by name',
  })
  async import(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const data = await this.importChargerAreasUseCase.execute(file);
    return { success: true, message: 'Import completed', data };
  }

  @Post()
  @Permissions('charger-area.create')
  @ApiOperation({ summary: 'Create a new charger area' })
  async create(@Body() dto: CreateChargerAreaDto) {
    const data = await this.createChargerAreaUseCase.execute(dto);
    return {
      success: true,
      message: 'Charger Area created successfully',
      data,
    };
  }

  @Get()
  @Permissions('charger-area.read')
  @ApiOperation({
    summary: 'List charger areas (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: ChargerAreaQueryDto) {
    const data = await this.getChargerAreasUseCase.execute(query);
    return {
      success: true,
      message: 'Charger Areas retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('charger-area.read')
  @ApiOperation({ summary: 'Get a charger area by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getChargerAreaUseCase.execute(id);
    return {
      success: true,
      message: 'Charger Area retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('charger-area.update')
  @ApiOperation({ summary: 'Update a charger area' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChargerAreaDto,
  ) {
    const data = await this.updateChargerAreaUseCase.execute(id, dto);
    return {
      success: true,
      message: 'Charger Area updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('charger-area.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a charger area' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteChargerAreaUseCase.execute(id);
    return {
      success: true,
      message: 'Charger Area deleted successfully',
      data: null,
    };
  }
}
