import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { RackQueryDto } from '../dto/rack-query.dto';
import { CreateRackDto } from '../dto/create-rack.dto';
import { UpdateRackDto } from '../dto/update-rack.dto';
import { CreateRackUseCase } from '../use-cases/create-rack.use-case';
import { DeleteRackUseCase } from '../use-cases/delete-rack.use-case';
import { GetRackUseCase } from '../use-cases/get-rack.use-case';
import { GetRacksUseCase } from '../use-cases/get-racks.use-case';
import { UpdateRackUseCase } from '../use-cases/update-rack.use-case';

@ApiTags('Racks')
@ApiBearerAuth('access-token')
@Controller('racks')
export class RackController {
  constructor(
    private readonly createRackUseCase: CreateRackUseCase,
    private readonly getRacksUseCase: GetRacksUseCase,
    private readonly getRackUseCase: GetRackUseCase,
    private readonly updateRackUseCase: UpdateRackUseCase,
    private readonly deleteRackUseCase: DeleteRackUseCase,
  ) {}

  @Post()
  @Permissions('rack.create')
  @ApiOperation({ summary: 'Create a new rack' })
  async create(@Body() dto: CreateRackDto) {
    const data = await this.createRackUseCase.execute(dto);
    return { success: true, message: 'Rack created successfully', data };
  }

  @Get()
  @Permissions('rack.read')
  @ApiOperation({
    summary: 'List racks (pagination, search by name, filter by status)',
  })
  async findAll(@Query() query: RackQueryDto) {
    const data = await this.getRacksUseCase.execute(query);
    return { success: true, message: 'Racks retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('rack.read')
  @ApiOperation({ summary: 'Get a rack by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getRackUseCase.execute(id);
    return { success: true, message: 'Rack retrieved successfully', data };
  }

  @Put(':id')
  @Permissions('rack.update')
  @ApiOperation({ summary: 'Update a rack' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRackDto,
  ) {
    const data = await this.updateRackUseCase.execute(id, dto);
    return { success: true, message: 'Rack updated successfully', data };
  }

  @Delete(':id')
  @Permissions('rack.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a rack' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteRackUseCase.execute(id);
    return { success: true, message: 'Rack deleted successfully', data: null };
  }
}
