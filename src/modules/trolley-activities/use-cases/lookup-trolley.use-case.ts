import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TROLLEYS_REPOSITORY } from '../../trolleys/repositories/trolley-repository.interface';
import type { ITrolleysRepository } from '../../trolleys/repositories/trolley-repository.interface';
import { USERS_REPOSITORY } from '../../users/repositories/users-repository.interface';
import type { IUsersRepository } from '../../users/repositories/users-repository.interface';
import { LookupTrolleyDto } from '../dto/lookup-trolley.dto';

// First scan of the flow (shared by both Take Trolley and Drop Trolley) —
// read-only. No TrolleyActivity row is created here, and it has no RCS side
// effect either — the actual "empty this node" call now happens on submit
// (TakeTrolleyUseCase for Take Trolley, CreateTrolleyActivityUseCase for
// Drop Trolley), once the operator has also scanned the area confirming
// exactly which node to empty, rather than inferring it here.
@Injectable()
export class LookupTrolleyUseCase {
  constructor(
    @Inject(TROLLEYS_REPOSITORY)
    private readonly trolleysRepository: ITrolleysRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async execute(dto: LookupTrolleyDto, userId: string) {
    const matches = await this.trolleysRepository.findAllActiveByCode(dto.code);
    if (matches.length === 0) {
      throw new BadRequestException('Trolley not found for this code');
    }

    // name/code are only unique per-Type now, so the same code can belong to
    // more than one active trolley — ask the operator which Type they mean
    // instead of guessing (guessing wrong sends the wrong Category/Model
    // Code Process to RCS, which then rejects the task order).
    let trolley = matches[0];
    if (matches.length > 1) {
      if (!dto.trolleyTypeId) {
        return {
          needsTypeSelection: true as const,
          trolleyCode: dto.code,
          options: matches.map((match) => ({
            trolleyId: match.id,
            trolleyTypeId: match.trolleyTypeId,
            trolleyTypeName: match.type.name,
          })),
        };
      }
      const selected = matches.find(
        (match) => match.trolleyTypeId === dto.trolleyTypeId,
      );
      if (!selected) {
        throw new BadRequestException(
          'Trolley not found for this code and Type',
        );
      }
      trolley = selected;
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      needsTypeSelection: false as const,
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
