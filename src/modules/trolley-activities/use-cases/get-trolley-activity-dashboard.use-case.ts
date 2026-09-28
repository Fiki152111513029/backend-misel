import { Inject, Injectable } from '@nestjs/common';
import type { AuthRequestUser } from '../../auth/types/auth-request-user.type';
import { TrolleyActivityDashboardQueryDto } from '../dto/trolley-activity-dashboard-query.dto';
import { TROLLEY_ACTIVITIES_REPOSITORY } from '../repositories/trolley-activity-repository.interface';
import type { ITrolleyActivitiesRepository } from '../repositories/trolley-activity-repository.interface';
import { OWN_ACTIVITIES_ONLY_ROLES } from '../constants/trolley-activity-scope.constant';
import { USERS_REPOSITORY } from '../../users/repositories/users-repository.interface';
import type { IUsersRepository } from '../../users/repositories/users-repository.interface';

/**
 * YYYY-MM-DD as a local-time date — `new Date('2026-09-28')` parses as UTC
 * midnight, which lands on the previous day east of UTC.
 */
function parseLocalDateOnly(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

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

    // `date` scopes to that one calendar day; otherwise it stays a lookback
    // window of `days` ending now, which is what the Trolley Activities
    // page still asks for.
    const since = query.date ? parseLocalDateOnly(query.date) : new Date();
    since.setHours(0, 0, 0, 0);
    let until: Date | undefined;
    if (query.date) {
      until = new Date(since);
      until.setDate(until.getDate() + 1);
    } else {
      since.setDate(since.getDate() - (query.days - 1));
    }

    const [stats, operatorOnline] = await Promise.all([
      this.trolleyActivitiesRepository.getDashboardStats({
        since,
        until,
        userId,
      }),
      this.usersRepository.getOperatorOnlineCounts(),
    ]);

    // Top Operators is a cross-user leaderboard — meaningless (and a scope
    // leak) once the results are already narrowed to one user's own rows.
    return {
      ...stats,
      activeOperators: operatorOnline.online,
      totalOperators: operatorOnline.total,
      ...(userId ? { topOperators: [] } : {}),
    };
  }
}
