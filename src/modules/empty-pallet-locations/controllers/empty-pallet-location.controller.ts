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
import { CreateEmptyPalletLocationDto } from '../dto/create-empty-pallet-location.dto';
import { EmptyPalletLocationQueryDto } from '../dto/empty-pallet-location-query.dto';
import { UpdateEmptyPalletLocationDto } from '../dto/update-empty-pallet-location.dto';
import { CreateEmptyPalletLocationUseCase } from '../use-cases/create-empty-pallet-location.use-case';
import { DeleteEmptyPalletLocationUseCase } from '../use-cases/delete-empty-pallet-location.use-case';
import { GetEmptyPalletLocationUseCase } from '../use-cases/get-empty-pallet-location.use-case';
import { GetEmptyPalletLocationsUseCase } from '../use-cases/get-empty-pallet-locations.use-case';
import { UpdateEmptyPalletLocationUseCase } from '../use-cases/update-empty-pallet-location.use-case';

@ApiTags('Empty Pallet Locations')
@ApiBearerAuth('access-token')
@Controller('empty-pallet-locations')
export class EmptyPalletLocationController {
  constructor(
    private readonly createEmptyPalletLocationUseCase: CreateEmptyPalletLocationUseCase,
    private readonly getEmptyPalletLocationsUseCase: GetEmptyPalletLocationsUseCase,
    private readonly getEmptyPalletLocationUseCase: GetEmptyPalletLocationUseCase,
    private readonly updateEmptyPalletLocationUseCase: UpdateEmptyPalletLocationUseCase,
    private readonly deleteEmptyPalletLocationUseCase: DeleteEmptyPalletLocationUseCase,
  ) {}

  @Post()
  @Permissions('empty-pallet-location.create')
  @ApiOperation({ summary: 'Create a new empty pallet location' })
  async create(@Body() dto: CreateEmptyPalletLocationDto) {
    const data = await this.createEmptyPalletLocationUseCase.execute(dto);
    return {
      success: true,
      message: 'Empty Pallet Location created successfully',
      data,
    };
  }

  @Get()
  @Permissions('empty-pallet-location.read')
  @ApiOperation({
    summary:
      'List empty pallet locations (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: EmptyPalletLocationQueryDto) {
    const data = await this.getEmptyPalletLocationsUseCase.execute(query);
    return {
      success: true,
      message: 'Empty Pallet Locations retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('empty-pallet-location.read')
  @ApiOperation({ summary: 'Get an empty pallet location by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getEmptyPalletLocationUseCase.execute(id);
    return {
      success: true,
      message: 'Empty Pallet Location retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('empty-pallet-location.update')
  @ApiOperation({ summary: 'Update an empty pallet location' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmptyPalletLocationDto,
  ) {
    const data = await this.updateEmptyPalletLocationUseCase.execute(id, dto);
    return {
      success: true,
      message: 'Empty Pallet Location updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('empty-pallet-location.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete an empty pallet location' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteEmptyPalletLocationUseCase.execute(id);
    return {
      success: true,
      message: 'Empty Pallet Location deleted successfully',
      data: null,
    };
  }
}
