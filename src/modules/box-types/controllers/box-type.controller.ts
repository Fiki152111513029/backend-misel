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
import { BoxTypeQueryDto } from '../dto/box-type-query.dto';
import { CreateBoxTypeDto } from '../dto/create-box-type.dto';
import { UpdateBoxTypeDto } from '../dto/update-box-type.dto';
import { CreateBoxTypeUseCase } from '../use-cases/create-box-type.use-case';
import { DeleteBoxTypeUseCase } from '../use-cases/delete-box-type.use-case';
import { GetBoxTypeUseCase } from '../use-cases/get-box-type.use-case';
import { GetBoxTypesUseCase } from '../use-cases/get-box-types.use-case';
import { UpdateBoxTypeUseCase } from '../use-cases/update-box-type.use-case';

@ApiTags('Box Types')
@ApiBearerAuth('access-token')
@Controller('box-types')
export class BoxTypeController {
  constructor(
    private readonly createBoxTypeUseCase: CreateBoxTypeUseCase,
    private readonly getBoxTypesUseCase: GetBoxTypesUseCase,
    private readonly getBoxTypeUseCase: GetBoxTypeUseCase,
    private readonly updateBoxTypeUseCase: UpdateBoxTypeUseCase,
    private readonly deleteBoxTypeUseCase: DeleteBoxTypeUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new box type' })
  async create(@Body() dto: CreateBoxTypeDto) {
    const data = await this.createBoxTypeUseCase.execute(dto);
    return { success: true, message: 'Box Type created successfully', data };
  }

  @Get()
  @ApiOperation({
    summary: 'List box types (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: BoxTypeQueryDto) {
    const data = await this.getBoxTypesUseCase.execute(query);
    return { success: true, message: 'Box Types retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a box type by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getBoxTypeUseCase.execute(id);
    return { success: true, message: 'Box Type retrieved successfully', data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a box type' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBoxTypeDto,
  ) {
    const data = await this.updateBoxTypeUseCase.execute(id, dto);
    return { success: true, message: 'Box Type updated successfully', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a box type' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteBoxTypeUseCase.execute(id);
    return {
      success: true,
      message: 'Box Type deleted successfully',
      data: null,
    };
  }
}
