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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FactoryMap } from '@prisma/client';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CreateFactoryMapDto } from '../dto/create-factory-map.dto';
import { FactoryMapQueryDto } from '../dto/factory-map-query.dto';
import { UpdateFactoryMapDto } from '../dto/update-factory-map.dto';
import { FactoryMapEntity } from '../entities/factory-map.entity';
import { CreateFactoryMapUseCase } from '../use-cases/create-factory-map.use-case';
import { DeleteFactoryMapUseCase } from '../use-cases/delete-factory-map.use-case';
import { GetFactoryMapUseCase } from '../use-cases/get-factory-map.use-case';
import { GetFactoryMapsUseCase } from '../use-cases/get-factory-maps.use-case';
import { GetLocationCodesUseCase } from '../use-cases/get-location-codes.use-case';
import { GetStockStatusUseCase } from '../use-cases/get-stock-status.use-case';
import { UpdateFactoryMapUseCase } from '../use-cases/update-factory-map.use-case';
import {
  deleteUploadedFile,
  factoryMapMulterOptions,
  toPublicUrl,
  toRelativePath,
} from '../utils/file-storage';

type UploadedFileFields = {
  image?: Express.Multer.File[];
  topology?: Express.Multer.File[];
};

const FILE_FIELDS = FileFieldsInterceptor(
  [
    { name: 'image', maxCount: 1 },
    { name: 'topology', maxCount: 1 },
  ],
  factoryMapMulterOptions,
);

@ApiTags('Factory Maps')
@ApiBearerAuth('access-token')
@Controller('factory-maps')
export class FactoryMapController {
  constructor(
    private readonly createFactoryMapUseCase: CreateFactoryMapUseCase,
    private readonly getFactoryMapsUseCase: GetFactoryMapsUseCase,
    private readonly getFactoryMapUseCase: GetFactoryMapUseCase,
    private readonly updateFactoryMapUseCase: UpdateFactoryMapUseCase,
    private readonly deleteFactoryMapUseCase: DeleteFactoryMapUseCase,
    private readonly getLocationCodesUseCase: GetLocationCodesUseCase,
    private readonly getStockStatusUseCase: GetStockStatusUseCase,
    private readonly configService: ConfigService,
  ) {}

  private toEntity(map: FactoryMap): FactoryMapEntity {
    const base = this.configService.get<string>('app.publicUrl') ?? '';
    return {
      id: map.id,
      name: map.name,
      areaNumber: map.areaNumber,
      imageUrl: toPublicUrl(base, map.imagePath),
      topologyUrl: toPublicUrl(base, map.topologyPath),
      createdAt: map.createdAt,
      updatedAt: map.updatedAt,
      deletedAt: map.deletedAt,
    };
  }

  @Post()
  @Permissions('factory-map.create')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FILE_FIELDS)
  @ApiOperation({
    summary:
      'Create a Factory Map (multipart: name + topology JSON file; image file optional — some maps have no floor-plan raster)',
  })
  async create(
    @Body() dto: CreateFactoryMapDto,
    @UploadedFiles() files: UploadedFileFields,
  ) {
    const image = files.image?.[0];
    const topology = files.topology?.[0];
    if (!topology) {
      throw new BadRequestException('A topology JSON file is required');
    }

    const imagePath = image ? toRelativePath(image) : undefined;
    const topologyPath = toRelativePath(topology);

    try {
      const data = await this.createFactoryMapUseCase.execute({
        name: dto.name,
        areaNumber: dto.areaNumber,
        imagePath,
        topologyPath,
      });
      return {
        success: true,
        message: 'Factory Map created successfully',
        data: this.toEntity(data),
      };
    } catch (error) {
      if (imagePath) deleteUploadedFile(imagePath);
      deleteUploadedFile(topologyPath);
      throw error;
    }
  }

  @Get()
  @Permissions('factory-map.read')
  @ApiOperation({
    summary: 'List Factory Maps (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: FactoryMapQueryDto) {
    const { items, meta } = await this.getFactoryMapsUseCase.execute(query);
    return {
      success: true,
      message: 'Factory Maps retrieved successfully',
      data: { items: items.map((item) => this.toEntity(item)), meta },
    };
  }

  @Get('location-codes')
  @Permissions('factory-map.read')
  @ApiOperation({
    summary:
      'Real location codes (iRaypleLocationCode) across Quarantine Areas, EXIM Locations, Empty Pallet Locations, Production Line Areas, and Charger Areas — used to filter which topology nodes get a marker on the Factory Map, plus the Charger Area subset for choosing which icon to render',
  })
  async locationCodes() {
    const data = await this.getLocationCodesUseCase.execute();
    return {
      success: true,
      message: 'Location codes retrieved successfully',
      data,
    };
  }

  @Get('stock-status')
  @Permissions('factory-map.read')
  @ApiOperation({
    summary:
      "Live full/empty status per Warehouse/Production Location node, straight from RCS's own getStockStatus (query param: areaId) — the Factory Map's node icons",
  })
  async stockStatus(@Query('areaId') areaId?: string) {
    const parsedAreaId = Number(areaId);
    if (!areaId || !Number.isFinite(parsedAreaId)) {
      throw new BadRequestException('areaId query param is required');
    }
    const data = await this.getStockStatusUseCase.execute(parsedAreaId);
    return {
      success: true,
      message: 'Stock status retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('factory-map.read')
  @ApiOperation({ summary: 'Get a Factory Map by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getFactoryMapUseCase.execute(id);
    return {
      success: true,
      message: 'Factory Map retrieved successfully',
      data: this.toEntity(data),
    };
  }

  @Put(':id')
  @Permissions('factory-map.update')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FILE_FIELDS)
  @ApiOperation({
    summary:
      'Update a Factory Map (multipart: name and/or replacement image/topology files, all optional)',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFactoryMapDto,
    @UploadedFiles() files: UploadedFileFields,
  ) {
    const image = files.image?.[0];
    const topology = files.topology?.[0];
    const imagePath = image ? toRelativePath(image) : undefined;
    const topologyPath = topology ? toRelativePath(topology) : undefined;

    try {
      const data = await this.updateFactoryMapUseCase.execute(id, {
        name: dto.name,
        areaNumber: dto.areaNumber,
        imagePath,
        topologyPath,
      });
      return {
        success: true,
        message: 'Factory Map updated successfully',
        data: this.toEntity(data),
      };
    } catch (error) {
      if (imagePath) deleteUploadedFile(imagePath);
      if (topologyPath) deleteUploadedFile(topologyPath);
      throw error;
    }
  }

  @Delete(':id')
  @Permissions('factory-map.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a Factory Map' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteFactoryMapUseCase.execute(id);
    return {
      success: true,
      message: 'Factory Map deleted successfully',
      data: null,
    };
  }
}
