import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateQuarantineLineDto } from '../dto/update-quarantine-line.dto';
import { QUARANTINE_LINES_REPOSITORY } from '../repositories/quarantine-line-repository.interface';
import type { IQuarantineLinesRepository } from '../repositories/quarantine-line-repository.interface';

@Injectable()
export class UpdateQuarantineLineUseCase {
  constructor(
    @Inject(QUARANTINE_LINES_REPOSITORY)
    private readonly quarantineLinesRepository: IQuarantineLinesRepository,
  ) {}

  async execute(id: string, dto: UpdateQuarantineLineDto) {
    const existing = await this.quarantineLinesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Quarantine Line not found');
    }

    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.quarantineLinesRepository.existsByName(
        dto.name,
        id,
      );
      if (nameTaken) {
        throw new BadRequestException('Quarantine Line name already in use');
      }
    }

    return this.quarantineLinesRepository.update(id, dto);
  }
}
