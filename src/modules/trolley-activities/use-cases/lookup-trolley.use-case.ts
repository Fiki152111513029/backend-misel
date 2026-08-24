import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TROLLEYS_REPOSITORY } from '../../trolleys/repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../../trolleys/repositories/trolley-repository.interface';
import { USERS_REPOSITORY } from '../../users/repositories/users-repository.interface';
import type { IUsersRepository } from '../../users/repositories/users-repository.interface';
import {
  RcsStockStatusService,
  NODE_STATUS_EMPTY,
} from '../../rcs-stock-status/rcs-stock-status.service';
import { LookupTrolleyDto } from '../dto/lookup-trolley.dto';

// First scan of the flow — no TrolleyActivity row is created yet (that only
// happens on final submit), this just resolves what the operator scanned
// and stamps a server-authoritative startDate for the duration calc later.
// It does have one side effect though: confirming this scan tells RCS the
// trolley's current spot (wherever it was last placed, or its configured
// dropping code if RCS has never reported a placement yet) is emptying out
// — the operator is now taking it away.
@Injectable()
export class LookupTrolleyUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly rcsStockStatusService: RcsStockStatusService,
  ) {}

  async execute(dto: LookupTrolleyDto, userId: string) {
    const trolley = await this.trolleysRepository.findActiveByCode(dto.code);
    if (!trolley) {
      throw new BadRequestException('Trolley not found for this code');
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const vacatingLocationCode = trolley.currentLocationCode ?? trolley.droppingLocationCode;
    if (vacatingLocationCode) {
      await this.rcsStockStatusService.updateStockStatus(
        vacatingLocationCode,
        NODE_STATUS_EMPTY,
      );
    }

    return {
      trolleyId: trolley.id,
      trolleyCode: trolley.code,
      trolleyName: trolley.name,
      userName: user.fullName,
      statusBeginning: trolley.status,
      droppingLocationCode: trolley.droppingLocationCode,
      startDate: new Date().toISOString(),
    };
  }
}
