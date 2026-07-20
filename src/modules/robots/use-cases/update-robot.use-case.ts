import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateRobotDto } from '../dto/update-robot.dto';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';

@Injectable()
export class UpdateRobotUseCase {
  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
  ) {}

  async execute(id: string, dto: UpdateRobotDto) {
    const existing = await this.robotsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Robot not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.robotsRepository.existsByName(dto.name, id);
      if (nameTaken) {
        throw new BadRequestException('Robot name already in use');
      }
    }

    if (
      dto.amrDeviceSerialNo &&
      dto.amrDeviceSerialNo !== existing.amrDeviceSerialNo
    ) {
      const serialTaken = await this.robotsRepository.existsBySerialNo(
        dto.amrDeviceSerialNo,
        id,
      );
      if (serialTaken) {
        throw new BadRequestException('AMR Device Serial No already in use');
      }
    }

    if (dto.amrDeviceNo && dto.amrDeviceNo !== existing.amrDeviceNo) {
      const deviceNoTaken = await this.robotsRepository.existsByDeviceNo(
        dto.amrDeviceNo,
        id,
      );
      if (deviceNoTaken) {
        throw new BadRequestException('AMR Device No already in use');
      }
    }

    return this.robotsRepository.update(id, dto);
  }
}
