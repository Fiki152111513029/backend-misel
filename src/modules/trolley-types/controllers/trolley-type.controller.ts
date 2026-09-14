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
import { TrolleyTypeQueryDto } from '../dto/trolley-type-query.dto';
import { CreateTrolleyTypeDto } from '../dto/create-trolley-type.dto';
import { UpdateTrolleyTypeDto } from '../dto/update-trolley-type.dto';
import { CreateTrolleyTypeUseCase } from '../use-cases/create-trolley-type.use-case';
import { DeleteTrolleyTypeUseCase } from '../use-cases/delete-trolley-type.use-case';
import { GetTrolleyTypeUseCase } from '../use-cases/get-trolley-type.use-case';
import { GetTrolleyTypesUseCase } from '../use-cases/get-trolley-types.use-case';
import { UpdateTrolleyTypeUseCase } from '../use-cases/update-trolley-type.use-case';
import { ExportTrolleyTypesUseCase } from '../use-cases/export-trolley-types.use-case';
import { ImportTrolleyTypesUseCase } from '../use-cases/import-trolley-types.use-case';

@ApiTags('Trolley Types')
@ApiBearerAuth('access-token')
@Controller('trolley-types')
export class TrolleyTypeController {
  constructor(
    private readonly createTrolleyTypeUseCase: CreateTrolleyTypeUseCase,
    private readonly getTrolleyTypesUseCase: GetTrolleyTypesUseCase,
    private readonly getTrolleyTypeUseCase: GetTrolleyTypeUseCase,
    private readonly updateTrolleyTypeUseCase: UpdateTrolleyTypeUseCase,
    private readonly deleteTrolleyTypeUseCase: DeleteTrolleyTypeUseCase,
    private readonly exportTrolleyTypesUseCase: ExportTrolleyTypesUseCase,
    private readonly importTrolleyTypesUseCase: ImportTrolleyTypesUseCase,
  ) {}

  // Must come before @Get(':id') — otherwise Nest would treat "export" as
  // a literal :id value here.
  @Get('export')
  @Permissions('trolley-type.read')
  @ApiOperation({ summary: 'Export all trolley types as CSV or XLSX' })
  async export(
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename, contentType } =
      await this.exportTrolleyTypesUseCase.execute(
        format === 'csv' ? 'csv' : 'xlsx',
      );
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  @Post('import')
  @Permissions('trolley-type.create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Import trolley types from an uploaded CSV or XLSX file — upserts by name',
  })
  async import(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const data = await this.importTrolleyTypesUseCase.execute(file);
    return { success: true, message: 'Import completed', data };
  }

  @Post()
  @Permissions('trolley-type.create')
  @ApiOperation({ summary: 'Create a new trolley type' })
  async create(@Body() dto: CreateTrolleyTypeDto) {
    const data = await this.createTrolleyTypeUseCase.execute(dto);
    return {
      success: true,
      message: 'Trolley Type created successfully',
      data,
    };
  }

  @Get()
  @Permissions('trolley-type.read')
  @ApiOperation({
    summary: 'List trolley types (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: TrolleyTypeQueryDto) {
    const data = await this.getTrolleyTypesUseCase.execute(query);
    return {
      success: true,
      message: 'Trolley Types retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('trolley-type.read')
  @ApiOperation({ summary: 'Get a trolley type by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getTrolleyTypeUseCase.execute(id);
    return {
      success: true,
      message: 'Trolley Type retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('trolley-type.update')
  @ApiOperation({ summary: 'Update a trolley type' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrolleyTypeDto,
  ) {
    const data = await this.updateTrolleyTypeUseCase.execute(id, dto);
    return {
      success: true,
      message: 'Trolley Type updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('trolley-type.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a trolley type' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteTrolleyTypeUseCase.execute(id);
    return {
      success: true,
      message: 'Trolley Type deleted successfully',
      data: null,
    };
  }
}
