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
import { ShiftQueryDto } from '../dto/shift-query.dto';
import { CreateShiftDto } from '../dto/create-shift.dto';
import { UpdateShiftDto } from '../dto/update-shift.dto';
import { CreateShiftUseCase } from '../use-cases/create-shift.use-case';
import { DeleteShiftUseCase } from '../use-cases/delete-shift.use-case';
import { GetShiftUseCase } from '../use-cases/get-shift.use-case';
import { GetShiftsUseCase } from '../use-cases/get-shifts.use-case';
import { UpdateShiftUseCase } from '../use-cases/update-shift.use-case';

@ApiTags('Shifts')
@ApiBearerAuth('access-token')
@Controller('shifts')
export class ShiftController {
  constructor(
    private readonly createShiftUseCase: CreateShiftUseCase,
    private readonly getShiftsUseCase: GetShiftsUseCase,
    private readonly getShiftUseCase: GetShiftUseCase,
    private readonly updateShiftUseCase: UpdateShiftUseCase,
    private readonly deleteShiftUseCase: DeleteShiftUseCase,
  ) {}

  @Post()
  @Permissions('shift.create')
  @ApiOperation({ summary: 'Create a new work shift' })
  async create(@Body() dto: CreateShiftDto) {
    const data = await this.createShiftUseCase.execute(dto);
    return { success: true, message: 'Shift created successfully', data };
  }

  @Get()
  @Permissions('shift.read')
  @ApiOperation({
    summary: 'List work shifts (pagination, search by name, sorting)',
  })
  async findAll(@Query() query: ShiftQueryDto) {
    const data = await this.getShiftsUseCase.execute(query);
    return { success: true, message: 'Shifts retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('shift.read')
  @ApiOperation({ summary: 'Get a work shift by id' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.getShiftUseCase.execute(id);
    return { success: true, message: 'Shift retrieved successfully', data };
  }

  @Put(':id')
  @Permissions('shift.update')
  @ApiOperation({ summary: 'Update a work shift' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShiftDto,
  ) {
    const data = await this.updateShiftUseCase.execute(id, dto);
    return { success: true, message: 'Shift updated successfully', data };
  }

  @Delete(':id')
  @Permissions('shift.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a work shift' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteShiftUseCase.execute(id);
    return { success: true, message: 'Shift deleted successfully', data: null };
  }
}
