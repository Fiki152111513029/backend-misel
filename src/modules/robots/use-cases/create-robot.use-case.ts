import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateRobotDto } from '../dto/create-robot.dto';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';

@Injectable()
export class CreateRobotUseCase {
  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
  ) {}

  async execute(dto: CreateRobotDto) {
    const nameTaken = await this.robotsRepository.existsByName(dto.name);
    if (nameTaken) {
      throw new BadRequestException('Robot name already in use');
    }

    const serialTaken = await this.robotsRepository.existsBySerialNo(
      dto.amrDeviceSerialNo,
    );
    if (serialTaken) {
      throw new BadRequestException('AMR Device Serial No already in use');
    }

    const deviceNoTaken = await this.robotsRepository.existsByDeviceNo(
      dto.amrDeviceNo,
    );
    if (deviceNoTaken) {
      throw new BadRequestException('AMR Device No already in use');
    }

    return this.robotsRepository.create(dto);
  }
}
