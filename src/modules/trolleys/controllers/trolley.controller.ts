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
import { TrolleyQueryDto } from '../dto/trolley-query.dto';
import { CreateTrolleyDto } from '../dto/create-trolley.dto';
import { UpdateTrolleyDto } from '../dto/update-trolley.dto';
import { CreateTrolleyUseCase } from '../use-cases/create-trolley.use-case';
import { DeleteTrolleyUseCase } from '../use-cases/delete-trolley.use-case';
import { GetTrolleyUseCase } from '../use-cases/get-trolley.use-case';
import { GetTrolleysUseCase } from '../use-cases/get-trolleys.use-case';
import { UpdateTrolleyUseCase } from '../use-cases/update-trolley.use-case';
import { ExportTrolleysUseCase } from '../use-cases/export-trolleys.use-case';
import { ImportTrolleysUseCase } from '../use-cases/import-trolleys.use-case';

@ApiTags('Trolleys')
@ApiBearerAuth('access-token')
@Controller('trolleys')
export class TrolleyController {
  constructor(
    private readonly createTrolleyUseCase: CreateTrolleyUseCase,
    private readonly getTrolleysUseCase: GetTrolleysUseCase,
    private readonly getTrolleyUseCase: GetTrolleyUseCase,
    private readonly updateTrolleyUseCase: UpdateTrolleyUseCase,
    private readonly deleteTrolleyUseCase: DeleteTrolleyUseCase,
    private readonly exportTrolleysUseCase: ExportTrolleysUseCase,
    private readonly importTrolleysUseCase: ImportTrolleysUseCase,
  ) {}

  // Must come before @Get(':id') — otherwise Nest would treat "export" as
  // a literal :id value here.
  @Get('export')
  @Permissions('trolley.read')
  @ApiOperation({ summary: 'Export all trolleys as CSV or XLSX' })
  async export(
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename, contentType } =
      await this.exportTrolleysUseCase.execute(
        format === 'csv' ? 'csv' : 'xlsx',
      );
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  @Post('import')
  @Permissions('trolley.create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Import trolleys from an uploaded CSV or XLSX file — upserts by name within the same Trolley Type',
  })
  async import(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const data = await this.importTrolleysUseCase.execute(file);
    return { success: true, message: 'Import completed', data };
  }

  @Post()
  @Permissions('trolley.create')
  @ApiOperation({ summary: 'Create a new trolley' })
  async create(@Body() dto: CreateTrolleyDto) {
    const data = await this.createTrolleyUseCase.execute(dto);
    return { success: true, message: 'Trolley created successfully', data };
  }

  @Get()
  @Permissions('trolley.read')
  @ApiOperation({
    summary: 'List trolleys (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: TrolleyQueryDto) {
    const data = await this.getTrolleysUseCase.execute(query);
    return { success: true, message: 'Trolleys retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('trolley.read')
  @ApiOperation({ summary: 'Get a trolley by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getTrolleyUseCase.execute(id);
    return { success: true, message: 'Trolley retrieved successfully', data };
  }

  @Put(':id')
  @Permissions('trolley.update')
  @ApiOperation({ summary: 'Update a trolley' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrolleyDto,
  ) {
    const data = await this.updateTrolleyUseCase.execute(id, dto);
    return { success: true, message: 'Trolley updated successfully', data };
  }

  @Delete(':id')
  @Permissions('trolley.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a trolley' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteTrolleyUseCase.execute(id);
    return {
      success: true,
      message: 'Trolley deleted successfully',
      data: null,
    };
  }
}
