import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from '../dto/update-user.dto';
import { USERS_REPOSITORY } from '../repositories/users-repository.interface';
import type { IUsersRepository } from '../repositories/users-repository.interface';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(id: string, dto: UpdateUserDto) {
    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.usersRepository.existsByEmail(
        dto.email,
        id,
      );
      if (emailTaken) {
        throw new BadRequestException('Email already in use');
      }
    }

    const saltRounds = this.configService.get<number>('bcrypt.saltRounds', 10);
    const password = dto.password
      ? await bcrypt.hash(dto.password, saltRounds)
      : undefined;

    return this.usersRepository.update(id, {
      email: dto.email,
      password,
      fullName: dto.fullName,
      roleId: dto.roleId,
      isActive: dto.isActive,
      priority: dto.priority,
    });
  }
}
