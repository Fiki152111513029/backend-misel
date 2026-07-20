import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { CreatePermissionUseCase } from '../use-cases/create-permission.use-case';
import { FindAllPermissionsUseCase } from '../use-cases/find-all-permissions.use-case';
import { FindOnePermissionUseCase } from '../use-cases/find-one-permission.use-case';
import { RemovePermissionUseCase } from '../use-cases/remove-permission.use-case';
import { UpdatePermissionUseCase } from '../use-cases/update-permission.use-case';

@ApiTags('Permissions')
@ApiBearerAuth('access-token')
@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly createPermissionUseCase: CreatePermissionUseCase,
    private readonly findAllPermissionsUseCase: FindAllPermissionsUseCase,
    private readonly findOnePermissionUseCase: FindOnePermissionUseCase,
    private readonly updatePermissionUseCase: UpdatePermissionUseCase,
    private readonly removePermissionUseCase: RemovePermissionUseCase,
  ) {}

  @Post()
  @Permissions('permission.create')
  @ApiOperation({ summary: 'Create a new permission' })
  create(@Body() dto: CreatePermissionDto) {
    return this.createPermissionUseCase.execute(dto);
  }

  @Get()
  @Permissions('permission.read')
  @ApiOperation({ summary: 'List all permissions' })
  findAll() {
    return this.findAllPermissionsUseCase.execute();
  }

  @Get(':id')
  @Permissions('permission.read')
  @ApiOperation({ summary: 'Get a permission by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.findOnePermissionUseCase.execute(id);
  }

  @Patch(':id')
  @Permissions('permission.update')
  @ApiOperation({ summary: 'Update a permission' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.updatePermissionUseCase.execute(id, dto);
  }

  @Delete(':id')
  @Permissions('permission.delete')
  @ApiOperation({ summary: 'Delete a permission' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.removePermissionUseCase.execute(id);
  }
}
