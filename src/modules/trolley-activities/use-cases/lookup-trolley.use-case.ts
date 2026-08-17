import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TROLLEYS_REPOSITORY } from '../../trolleys/repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../../trolleys/repositories/trolley-repository.interface';
import { USERS_REPOSITORY } from '../../users/repositories/users-repository.interface';
import type { IUsersRepository } from '../../users/repositories/users-repository.interface';
import { LookupTrolleyDto } from '../dto/lookup-trolley.dto';

// First scan of the flow — no TrolleyActivity row is created yet (that only
// happens on final submit), this just resolves what the operator scanned
// and stamps a server-authoritative startDate for the duration calc later.
@Injectable()
export class LookupTrolleyUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
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
