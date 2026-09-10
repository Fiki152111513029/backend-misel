import { Inject, Injectable } from '@nestjs/common';
import type { AuthRequestUser } from '../../auth/types/auth-request-user.type';
import { TrolleyActivityDashboardQueryDto } from '../dto/trolley-activity-dashboard-query.dto';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';
import { OWN_ACTIVITIES_ONLY_ROLES } from '../constants/trolley-activity-scope.constant';
import { USERS_REPOSITORY } from '../../users/repositories/users-repository.interface';
import type { IUsersRepository } from '../../users/repositories/users-repository.interface';

@Injectable()
export class GetTrolleyActivityDashboardUseCase {
  constructor(
    @Inject(TROLLEY_ACTIVITIES_REPOSITORY)
    private readonly trolleyActivitiesRepository: ITrolleyActivitiesRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
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

    const [stats, operatorSessions] = await Promise.all([
      this.trolleyActivitiesRepository.getDashboardStats({ since, userId }),
      this.usersRepository.getOperatorSessionCounts(),
    ]);

    // Top Operators is a cross-user leaderboard — meaningless (and a scope
    // leak) once the results are already narrowed to one user's own rows.
    return {
      ...stats,
      activeOperators: operatorSessions.active,
      totalOperators: operatorSessions.total,
      ...(userId ? { topOperators: [] } : {}),
    };
  }
}
