import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../dto/create-user.dto';
import { USERS_REPOSITORY } from '../repositories/users-repository.interface';
import type { IUsersRepository } from '../repositories/users-repository.interface';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: CreateUserDto) {
    const exists = await this.usersRepository.existsByUsernameOrEmail(
      dto.username,
      dto.email,
    );
    if (exists) {
      throw new ConflictException('Username or email already in use');
    }

    const saltRounds = this.configService.get<number>('bcrypt.saltRounds', 10);
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    return this.usersRepository.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
      // Full Name isn't required on the form — leave it blank if not given.
      fullName: dto.fullName?.trim() ?? '',
      roleId: dto.roleId,
      isActive: dto.isActive,
      priority: dto.priority,
    });
  }
}
