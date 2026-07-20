import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateRequestBoxDto } from '../dto/create-request-box.dto';
import { REQUEST_BOXES_REPOSITORY } from '../repositories/request-box-repository.interface';
import type { IRequestBoxesRepository } from '../repositories/request-box-repository.interface';

@Injectable()
export class CreateRequestBoxUseCase {
  constructor(
    @Inject(REQUEST_BOXES_REPOSITORY)
    private readonly requestBoxesRepository: IRequestBoxesRepository,
  ) {}

  async execute(dto: CreateRequestBoxDto, userId: string, userRole: string) {
    const operatorId = await this.requestBoxesRepository.findProductionLineOperatorId(
      dto.productionLineId,
    );
    if (operatorId === null) {
      throw new BadRequestException('Production Line not found');
    }

    // Super Admin may request for any production line; everyone else may only
    // request for the production line they operate.
    if (userRole !== 'Super Admin' && operatorId !== userId) {
      throw new ForbiddenException(
        'You can only create request boxes for your own production line',
      );
    }

    const boxTypeExists =
      await this.requestBoxesRepository.existsActiveBoxTypeById(dto.boxTypeId);
    if (!boxTypeExists) {
      throw new BadRequestException('Box Type not found');
    }

    return this.requestBoxesRepository.create(dto);
  }
}
