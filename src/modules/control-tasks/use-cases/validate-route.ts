import { BadRequestException } from '@nestjs/common';
import type { IControlTasksRepository } from '../repositories/control-task-repository.interface';

/**
 * Trims the legs and checks every one against the live Production/Warehouse
 * location codes. The route is what taskPath is built from, so a mistyped or
 * retired code would only surface later as a rejected RCS order — catching it
 * here keeps a saved Control Task always dispatchable.
 *
 * Order and repeats are preserved exactly as sent: "L3CPA,FGA,EPA,L3CPA" is a
 * valid route, not a duplicate to be collapsed.
 */
export async function validateRoute(
  repository: IControlTasksRepository,
  route: string[],
): Promise<string[]> {
  const legs = route.map((code) => code.trim()).filter(Boolean);
  if (legs.length === 0) {
    throw new BadRequestException('Route must have at least one location');
  }

  const options = await repository.findRouteOptions();
  const known = new Set(options.map((option) => option.iRaypleLocationCode));
  const unknown = [...new Set(legs.filter((code) => !known.has(code)))];
  if (unknown.length > 0) {
    throw new BadRequestException(
      `Unknown iRayple Location Code in route: ${unknown.join(', ')}`,
    );
  }

  return legs;
}
