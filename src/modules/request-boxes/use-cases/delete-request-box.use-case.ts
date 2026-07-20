import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { REQUEST_BOXES_REPOSITORY } from '../repositories/request-box-repository.interface';
import type { IRequestBoxesRepository } from '../repositories/request-box-repository.interface';

@Injectable()
export class DeleteRequestBoxUseCase {
  constructor(
    @Inject(REQUEST_BOXES_REPOSITORY)
    private readonly requestBoxesRepository: IRequestBoxesRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.requestBoxesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Request Box not found');
    }
    await this.requestBoxesRepository.softDelete(id);
  }
}
