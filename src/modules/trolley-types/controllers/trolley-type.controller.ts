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
import { TrolleyTypeQueryDto } from '../dto/trolley-type-query.dto';
import { CreateTrolleyTypeDto } from '../dto/create-trolley-type.dto';
import { UpdateTrolleyTypeDto } from '../dto/update-trolley-type.dto';
import { CreateTrolleyTypeUseCase } from '../use-cases/create-trolley-type.use-case';
import { DeleteTrolleyTypeUseCase } from '../use-cases/delete-trolley-type.use-case';
import { GetTrolleyTypeUseCase } from '../use-cases/get-trolley-type.use-case';
import { GetTrolleyTypesUseCase } from '../use-cases/get-trolley-types.use-case';
import { UpdateTrolleyTypeUseCase } from '../use-cases/update-trolley-type.use-case';

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
  ) {}

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
