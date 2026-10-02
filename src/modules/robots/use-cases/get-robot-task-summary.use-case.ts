import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RobotTaskSummaryQueryDto } from '../dto/robot-task-summary-query.dto';
import { ROBOTS_REPOSITORY } from '../repositories/robot-repository.interface';
import type { IRobotsRepository } from '../repositories/robot-repository.interface';

export interface RobotTaskSummaryRow {
  robotId: string;
  robotName: string;
  unitId: string;
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  cancelled: number;
}

interface Bucket {
  completed: number;
  inProgress: number;
  failed: number;
  cancelled: number;
}

function emptyBucket(): Bucket {
  return { completed: 0, inProgress: 0, failed: 0, cancelled: 0 };
}

/**
 * YYYY-MM-DD as a local-time date — `new Date('2026-10-02')` parses as UTC
 * midnight, which lands on the previous day east of UTC.
 */
function parseLocalDateOnly(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * How many tasks each robot ran, bucketed the way the Fleet Overview tiles
 * show them. Counts every kind of work a robot can be assigned — Tasks,
 * Warehouse Cart Tasks, Trolley Activities and Custom Task runs — because
 * from the floor's point of view they are all just "jobs this AMR did".
 *
 * PENDING folds into In Progress: the tiles have no separate "not started"
 * column, and a job that is accepted but not yet moving is still outstanding
 * work rather than a finished outcome.
 */
@Injectable()
export class GetRobotTaskSummaryUseCase {
  constructor(
    @Inject(ROBOTS_REPOSITORY)
    private readonly robotsRepository: IRobotsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    query: RobotTaskSummaryQueryDto,
  ): Promise<RobotTaskSummaryRow[]> {
    const { items: robots } = await this.robotsRepository.findAll({
      page: 1,
      limit: 1000,
      areaId: query.areaId,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    if (robots.length === 0) return [];

    const robotIds = robots.map((robot) => robot.id);
    const createdAt = this.dayRange(query.date);
    const scope = {
      robotId: { in: robotIds },
      ...(createdAt ? { createdAt } : {}),
    };
    const notDeleted = { deletedAt: null };

    const [tasks, cartTasks, activities, customRuns] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['robotId', 'status'],
        where: { ...scope, ...notDeleted },
        _count: { _all: true },
      }),
      this.prisma.warehouseCartTask.groupBy({
        by: ['robotId', 'status'],
        where: { ...scope, ...notDeleted },
        _count: { _all: true },
      }),
      this.prisma.trolleyActivity.groupBy({
        by: ['robotId', 'status'],
        where: { ...scope, ...notDeleted },
        _count: { _all: true },
      }),
      // Custom Task runs are the only ones that can be cancelled outright
      // (see CustomTaskRun.cancelledAt), so they are grouped with that flag
      // rather than by status alone.
      this.prisma.customTaskRun.groupBy({
        by: ['robotId', 'status', 'cancelledAt'],
        where: scope,
        _count: { _all: true },
      }),
    ]);

    const buckets = new Map<string, Bucket>(
      robotIds.map((id) => [id, emptyBucket()]),
    );

    const add = (robotId: string | null, key: keyof Bucket, count: number) => {
      if (!robotId) return;
      const bucket = buckets.get(robotId);
      if (bucket) bucket[key] += count;
    };

    for (const row of [...tasks, ...cartTasks, ...activities]) {
      add(row.robotId, bucketOf(row.status, false), row._count._all);
    }
    for (const row of customRuns) {
      add(
        row.robotId,
        bucketOf(row.status, row.cancelledAt !== null),
        row._count._all,
      );
    }

    return robots.map((robot) => {
      const bucket = buckets.get(robot.id) ?? emptyBucket();
      return {
        robotId: robot.id,
        robotName: robot.name,
        unitId: robot.amrDeviceSerialNo,
        total:
          bucket.completed +
          bucket.inProgress +
          bucket.failed +
          bucket.cancelled,
        ...bucket,
      };
    });
  }

  /** One calendar day (server local time), or undefined for all time. */
  private dayRange(date?: string) {
    if (!date) return undefined;
    const since = parseLocalDateOnly(date);
    const until = new Date(since);
    until.setDate(until.getDate() + 1);
    return { gte: since, lt: until };
  }
}

function bucketOf(status: string, wasCancelled: boolean): keyof Bucket {
  if (wasCancelled) return 'cancelled';
  if (status === 'COMPLETED') return 'completed';
  if (status === 'FAILED') return 'failed';
  return 'inProgress';
}
