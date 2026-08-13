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
import { TrolleyQueryDto } from '../dto/trolley-query.dto';
import { CreateTrolleyDto } from '../dto/create-trolley.dto';
import { UpdateTrolleyDto } from '../dto/update-trolley.dto';
import { CreateTrolleyUseCase } from '../use-cases/create-trolley.use-case';
import { DeleteTrolleyUseCase } from '../use-cases/delete-trolley.use-case';
import { GetTrolleyUseCase } from '../use-cases/get-trolley.use-case';
import { GetTrolleysUseCase } from '../use-cases/get-trolleys.use-case';
import { UpdateTrolleyUseCase } from '../use-cases/update-trolley.use-case';

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
  ) {}

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
    return { success: true, message: 'Trolley deleted successfully', data: null };
  }
}
