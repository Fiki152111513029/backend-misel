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
import { ParkingAreaQueryDto } from '../dto/parking-area-query.dto';
import { CreateParkingAreaDto } from '../dto/create-parking-area.dto';
import { UpdateParkingAreaDto } from '../dto/update-parking-area.dto';
import { CreateParkingAreaUseCase } from '../use-cases/create-parking-area.use-case';
import { DeleteParkingAreaUseCase } from '../use-cases/delete-parking-area.use-case';
import { GetParkingAreaUseCase } from '../use-cases/get-parking-area.use-case';
import { GetParkingAreasUseCase } from '../use-cases/get-parking-areas.use-case';
import { UpdateParkingAreaUseCase } from '../use-cases/update-parking-area.use-case';

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
  ) {}

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
