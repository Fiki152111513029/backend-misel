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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthRequestUser } from '../../auth/types/auth-request-user.type';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CreateRequestBoxDto } from '../dto/create-request-box.dto';
import { RequestBoxQueryDto } from '../dto/request-box-query.dto';
import { CreateRequestBoxUseCase } from '../use-cases/create-request-box.use-case';
import { DeleteRequestBoxUseCase } from '../use-cases/delete-request-box.use-case';
import { GetRequestBoxesUseCase } from '../use-cases/get-request-boxes.use-case';

@ApiTags('Request Box')
@ApiBearerAuth('access-token')
@Controller('request-boxes')
export class RequestBoxController {
  constructor(
    private readonly createRequestBoxUseCase: CreateRequestBoxUseCase,
    private readonly getRequestBoxesUseCase: GetRequestBoxesUseCase,
    private readonly deleteRequestBoxUseCase: DeleteRequestBoxUseCase,
  ) {}

  @Post()
  @Permissions('request-box.create')
  @ApiOperation({ summary: 'Create a new request box' })
  async create(
    @Body() dto: CreateRequestBoxDto,
    @CurrentUser() user: AuthRequestUser,
  ) {
    const data = await this.createRequestBoxUseCase.execute(
      dto,
      user.userId,
      user.role,
    );
    return {
      success: true,
      message: 'Request Box created successfully',
      data,
    };
  }

  @Get()
  @Permissions('request-box.read')
  @ApiOperation({ summary: 'List request boxes (pagination, sorting)' })
  async findAll(@Query() query: RequestBoxQueryDto) {
    const data = await this.getRequestBoxesUseCase.execute(query);
    return {
      success: true,
      message: 'Request Boxes retrieved successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('request-box.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a request box' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteRequestBoxUseCase.execute(id);
    return {
      success: true,
      message: 'Request Box deleted successfully',
      data: null,
    };
  }
}
