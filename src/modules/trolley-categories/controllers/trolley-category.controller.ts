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
import { TrolleyCategoryQueryDto } from '../dto/trolley-category-query.dto';
import { CreateTrolleyCategoryDto } from '../dto/create-trolley-category.dto';
import { UpdateTrolleyCategoryDto } from '../dto/update-trolley-category.dto';
import { CreateTrolleyCategoryUseCase } from '../use-cases/create-trolley-category.use-case';
import { DeleteTrolleyCategoryUseCase } from '../use-cases/delete-trolley-category.use-case';
import { GetTrolleyCategoryUseCase } from '../use-cases/get-trolley-category.use-case';
import { GetTrolleyCategoriesUseCase } from '../use-cases/get-trolley-categories.use-case';
import { UpdateTrolleyCategoryUseCase } from '../use-cases/update-trolley-category.use-case';

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
  ) {}

  @Post()
  @Permissions('trolley-category.create')
  @ApiOperation({ summary: 'Create a new trolley category' })
  async create(@Body() dto: CreateTrolleyCategoryDto) {
    const data = await this.createTrolleyCategoryUseCase.execute(dto);
    return { success: true, message: 'Trolley Category created successfully', data };
  }

  @Get()
  @Permissions('trolley-category.read')
  @ApiOperation({
    summary: 'List trolley categories (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: TrolleyCategoryQueryDto) {
    const data = await this.getTrolleyCategoriesUseCase.execute(query);
    return { success: true, message: 'Trolley Categories retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('trolley-category.read')
  @ApiOperation({ summary: 'Get a trolley category by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getTrolleyCategoryUseCase.execute(id);
    return { success: true, message: 'Trolley Category retrieved successfully', data };
  }

  @Put(':id')
  @Permissions('trolley-category.update')
  @ApiOperation({ summary: 'Update a trolley category' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrolleyCategoryDto,
  ) {
    const data = await this.updateTrolleyCategoryUseCase.execute(id, dto);
    return { success: true, message: 'Trolley Category updated successfully', data };
  }

  @Delete(':id')
  @Permissions('trolley-category.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a trolley category' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteTrolleyCategoryUseCase.execute(id);
    return { success: true, message: 'Trolley Category deleted successfully', data: null };
  }
}
