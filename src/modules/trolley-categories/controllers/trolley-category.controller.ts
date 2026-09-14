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
import { TrolleyCategoryQueryDto } from '../dto/trolley-category-query.dto';
import { CreateTrolleyCategoryDto } from '../dto/create-trolley-category.dto';
import { UpdateTrolleyCategoryDto } from '../dto/update-trolley-category.dto';
import { CreateTrolleyCategoryUseCase } from '../use-cases/create-trolley-category.use-case';
import { DeleteTrolleyCategoryUseCase } from '../use-cases/delete-trolley-category.use-case';
import { GetTrolleyCategoryUseCase } from '../use-cases/get-trolley-category.use-case';
import { GetTrolleyCategoriesUseCase } from '../use-cases/get-trolley-categories.use-case';
import { UpdateTrolleyCategoryUseCase } from '../use-cases/update-trolley-category.use-case';
import { ExportTrolleyCategoriesUseCase } from '../use-cases/export-trolley-categories.use-case';
import { ImportTrolleyCategoriesUseCase } from '../use-cases/import-trolley-categories.use-case';

@ApiTags('Trolley Categories')
@ApiBearerAuth('access-token')
@Controller('trolley-categories')
export class TrolleyCategoryController {
  constructor(
    private readonly createTrolleyCategoryUseCase: CreateTrolleyCategoryUseCase,
    private readonly getTrolleyCategoriesUseCase: GetTrolleyCategoriesUseCase,
    private readonly getTrolleyCategoryUseCase: GetTrolleyCategoryUseCase,
    private readonly updateTrolleyCategoryUseCase: UpdateTrolleyCategoryUseCase,
    private readonly deleteTrolleyCategoryUseCase: DeleteTrolleyCategoryUseCase,
    private readonly exportTrolleyCategoriesUseCase: ExportTrolleyCategoriesUseCase,
    private readonly importTrolleyCategoriesUseCase: ImportTrolleyCategoriesUseCase,
  ) {}

  // Must come before @Get(':id') — otherwise Nest would treat "export" as
  // a literal :id value here.
  @Get('export')
  @Permissions('trolley-category.read')
  @ApiOperation({ summary: 'Export all trolley categories as CSV or XLSX' })
  async export(
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename, contentType } =
      await this.exportTrolleyCategoriesUseCase.execute(
        format === 'csv' ? 'csv' : 'xlsx',
      );
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  @Post('import')
  @Permissions('trolley-category.create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Import trolley categories from an uploaded CSV or XLSX file — upserts by name',
  })
  async import(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const data = await this.importTrolleyCategoriesUseCase.execute(file);
    return { success: true, message: 'Import completed', data };
  }

  @Post()
  @Permissions('trolley-category.create')
  @ApiOperation({ summary: 'Create a new trolley category' })
  async create(@Body() dto: CreateTrolleyCategoryDto) {
    const data = await this.createTrolleyCategoryUseCase.execute(dto);
    return {
      success: true,
      message: 'Trolley Category created successfully',
      data,
    };
  }

  @Get()
  @Permissions('trolley-category.read')
  @ApiOperation({
    summary: 'List trolley categories (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: TrolleyCategoryQueryDto) {
    const data = await this.getTrolleyCategoriesUseCase.execute(query);
    return {
      success: true,
      message: 'Trolley Categories retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('trolley-category.read')
  @ApiOperation({ summary: 'Get a trolley category by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getTrolleyCategoryUseCase.execute(id);
    return {
      success: true,
      message: 'Trolley Category retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('trolley-category.update')
  @ApiOperation({ summary: 'Update a trolley category' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrolleyCategoryDto,
  ) {
    const data = await this.updateTrolleyCategoryUseCase.execute(id, dto);
    return {
      success: true,
      message: 'Trolley Category updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('trolley-category.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a trolley category' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteTrolleyCategoryUseCase.execute(id);
    return {
      success: true,
      message: 'Trolley Category deleted successfully',
      data: null,
    };
  }
}
