import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';

@Injectable()
export class DeleteRobotUseCase {
  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.robotsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Robot not found');
    }
    await this.robotsRepository.softDelete(id);
  }
}
