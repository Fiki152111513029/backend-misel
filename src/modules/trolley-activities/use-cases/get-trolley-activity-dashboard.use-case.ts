import { Inject, Injectable } from '@nestjs/common';
import type { AuthRequestUser } from '../../auth/types/auth-request-user.type';
import { TrolleyActivityDashboardQueryDto } from '../dto/trolley-activity-dashboard-query.dto';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';
import { OWN_ACTIVITIES_ONLY_ROLES } from '../constants/trolley-activity-scope.constant';

@Injectable()
export class GetTrolleyActivityDashboardUseCase {
  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
  ) {}

  async execute(
    query: TrolleyActivityDashboardQueryDto,
    currentUser: AuthRequestUser,
  ) {
    const userId = OWN_ACTIVITIES_ONLY_ROLES.includes(currentUser.role)
      ? currentUser.userId
      : undefined;

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (query.days - 1));

    const stats = await this.trolleyActivitiesRepository.getDashboardStats({
      since,
      userId,
    });

    // Top Operators is a cross-user leaderboard — meaningless (and a scope
    // leak) once the results are already narrowed to one user's own rows.
    return userId ? { ...stats, topOperators: [] } : stats;
  }
}
