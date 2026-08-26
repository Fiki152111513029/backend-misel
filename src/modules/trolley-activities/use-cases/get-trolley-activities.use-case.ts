import { Inject, Injectable } from '@nestjs/common';
import type { AuthRequestUser } from '../../auth/types/auth-request-user.type';
import { TrolleyActivityQueryDto } from '../dto/trolley-activity-query.dto';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';

// Warehouse/Operator are line staff — they only get to see their own
// history here, not everyone's. Every other role (Super Admin, and any
// future admin-ish role) keeps the full audit view. Never trust the client
// to say which scope it wants — this is derived purely from the requesting
// user's own role.
const OWN_ACTIVITIES_ONLY_ROLES = ['Warehouse', 'Operator'];

@Injectable()
export class GetTrolleyActivitiesUseCase {
  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
  ) {}

  async execute(query: TrolleyActivityQueryDto, currentUser: AuthRequestUser) {
    const userId = OWN_ACTIVITIES_ONLY_ROLES.includes(currentUser.role)
      ? currentUser.userId
      : undefined;

    const { items, total } = await this.trolleyActivitiesRepository.findAll({
      ...query,
      userId,
    });

    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
