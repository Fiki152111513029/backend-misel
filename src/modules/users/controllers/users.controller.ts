import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { CreateUserUseCase } from '../use-cases/create-user.use-case';
import { FindAllUsersUseCase } from '../use-cases/find-all-users.use-case';
import { FindOneUserUseCase } from '../use-cases/find-one-user.use-case';
import { RemoveUserUseCase } from '../use-cases/remove-user.use-case';
import { UpdateUserUseCase } from '../use-cases/update-user.use-case';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
    private readonly findOneUserUseCase: FindOneUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly removeUserUseCase: RemoveUserUseCase,
  ) {}

  @Post()
  @Permissions('user.create')
  @ApiOperation({
    summary: 'Create a new user (also serves as the Register API)',
  })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.createUserUseCase.execute(dto);
    return new UserResponseDto(user);
  }

  @Get()
  @Permissions('user.read')
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll() {
    const users = await this.findAllUsersUseCase.execute();
    return users.map((user) => new UserResponseDto(user));
  }

  @Get(':id')
  @Permissions('user.read')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.findOneUserUseCase.execute(id);
    return new UserResponseDto(user);
  }

  @Patch(':id')
  @Permissions('user.update')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.updateUserUseCase.execute(id, dto);
    return new UserResponseDto(user);
  }

  @Delete(':id')
  @Permissions('user.delete')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.removeUserUseCase.execute(id);
  }
}
