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
import { ChargerAreaQueryDto } from '../dto/charger-area-query.dto';
import { CreateChargerAreaDto } from '../dto/create-charger-area.dto';
import { UpdateChargerAreaDto } from '../dto/update-charger-area.dto';
import { CreateChargerAreaUseCase } from '../use-cases/create-charger-area.use-case';
import { DeleteChargerAreaUseCase } from '../use-cases/delete-charger-area.use-case';
import { GetChargerAreaUseCase } from '../use-cases/get-charger-area.use-case';
import { GetChargerAreasUseCase } from '../use-cases/get-charger-areas.use-case';
import { UpdateChargerAreaUseCase } from '../use-cases/update-charger-area.use-case';

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
  ) {}

  @Post()
  @Permissions('charger-area.create')
  @ApiOperation({ summary: 'Create a new charger area' })
  async create(@Body() dto: CreateChargerAreaDto) {
    const data = await this.createChargerAreaUseCase.execute(dto);
    return { success: true, message: 'Charger Area created successfully', data };
  }

  @Get()
  @Permissions('charger-area.read')
  @ApiOperation({
    summary: 'List charger areas (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: ChargerAreaQueryDto) {
    const data = await this.getChargerAreasUseCase.execute(query);
    return { success: true, message: 'Charger Areas retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('charger-area.read')
  @ApiOperation({ summary: 'Get a charger area by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getChargerAreaUseCase.execute(id);
    return { success: true, message: 'Charger Area retrieved successfully', data };
  }

  @Put(':id')
  @Permissions('charger-area.update')
  @ApiOperation({ summary: 'Update a charger area' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChargerAreaDto,
  ) {
    const data = await this.updateChargerAreaUseCase.execute(id, dto);
    return { success: true, message: 'Charger Area updated successfully', data };
  }

  @Delete(':id')
  @Permissions('charger-area.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a charger area' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteChargerAreaUseCase.execute(id);
    return { success: true, message: 'Charger Area deleted successfully', data: null };
  }
}
