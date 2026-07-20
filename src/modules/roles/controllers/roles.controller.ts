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
import { AssignPermissionsDto } from '../dto/assign-permissions.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignPermissionsUseCase } from '../use-cases/assign-permissions.use-case';
import { CreateRoleUseCase } from '../use-cases/create-role.use-case';
import { FindAllRolesUseCase } from '../use-cases/find-all-roles.use-case';
import { FindOneRoleUseCase } from '../use-cases/find-one-role.use-case';
import { RemoveRoleUseCase } from '../use-cases/remove-role.use-case';
import { UpdateRoleUseCase } from '../use-cases/update-role.use-case';

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@Controller('roles')
export class RolesController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly findAllRolesUseCase: FindAllRolesUseCase,
    private readonly findOneRoleUseCase: FindOneRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly removeRoleUseCase: RemoveRoleUseCase,
    private readonly assignPermissionsUseCase: AssignPermissionsUseCase,
  ) {}

  @Post()
  @Permissions('role.create')
  @ApiOperation({ summary: 'Create a new role' })
  create(@Body() dto: CreateRoleDto) {
    return this.createRoleUseCase.execute(dto);
  }

  @Get()
  @Permissions('role.read')
  @ApiOperation({ summary: 'List all roles' })
  findAll() {
    return this.findAllRolesUseCase.execute();
  }

  @Get(':id')
  @Permissions('role.read')
  @ApiOperation({ summary: 'Get a role by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.findOneRoleUseCase.execute(id);
  }

  @Patch(':id')
  @Permissions('role.update')
  @ApiOperation({ summary: 'Update a role' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.updateRoleUseCase.execute(id, dto);
  }

  @Delete(':id')
  @Permissions('role.delete')
  @ApiOperation({ summary: 'Delete a role' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.removeRoleUseCase.execute(id);
  }

  @Patch(':id/permissions')
  @Permissions('role.update')
  @ApiOperation({ summary: "Replace a role's assigned permissions" })
  assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.assignPermissionsUseCase.execute(id, dto);
  }
}
