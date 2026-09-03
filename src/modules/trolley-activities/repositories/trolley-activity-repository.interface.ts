import { TaskStatus, TrolleyActivity, TrolleyStatus } from '@prisma/client';

export interface TrolleyActivityWithRelations extends TrolleyActivity {
  user: { id: string; fullName: string };
  trolley: { id: string; code: string; name: string };
  robot: { id: string; name: string } | null;
}

export interface CreateTrolleyActivityData {
  userId: string;
  trolleyId: string;
  statusBeginning: TrolleyStatus;
  statusEnd: TrolleyStatus;
  pickupLocationCode: string;
  droppingLocationCode?: string;
  queueRole: string;
  startDate: Date;
  endDate: Date;
  taskId: string;
}

// What Take Trolley writes — an "open" row: no statusEnd/endDate yet, and no
// RCS task has actually been sent (taskId here is just a reserved
// placeholder, overwritten once Drop Trolley completes this row).
export interface CreateOpenTrolleyActivityData {
  userId: string;
  trolleyId: string;
  statusBeginning: TrolleyStatus;
  pickupLocationCode: string;
  queueRole: string;
  startDate: Date;
  taskId: string;
}

// What Drop Trolley writes onto a previously-open row to complete it.
export interface CompleteTrolleyActivityData {
  statusEnd: TrolleyStatus;
  pickupLocationCode: string;
  droppingLocationCode?: string;
  endDate: Date;
  taskId: string;
}

export interface FindAllTrolleyActivitiesParams {
  page: number;
  limit: number;
  // Restricts the list to one user's own activities — set for Warehouse/
  // Operator roles (see GetTrolleyActivitiesUseCase), left unset for roles
  // that get the full audit view (e.g. Super Admin).
  userId?: string;
}

export interface FindAllTrolleyActivitiesResult {
  items: TrolleyActivityWithRelations[];
  total: number;
}

export const TROLLEY_ACTIVITIES_REPOSITORY = 'TROLLEY_ACTIVITIES_REPOSITORY';

export interface ActiveTrolleyActivityByRobot {
  robotId: string;
  // What the trolley physically has on it *right now*, while still in
  // transit — statusBeginning, not statusEnd. The trolley's own `status`
  // field already flips to statusEnd the instant the task order is
  // accepted (see CreateTrolleyActivityUseCase), well before the robot has
  // actually delivered it, so it can't be used to represent "what's being
  // carried" while the task is still PENDING/IN_PROGRESS.
  carrying: TrolleyStatus;
}

export interface DashboardStatsParams {
  since: Date;
  // Restricts the stats to one user's own activities — set for Warehouse/
  // Operator roles, left unset for roles that get the full picture.
  userId?: string;
}

export interface DashboardStatsResult {
  totals: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    failed: number;
  };
  // Average COMPLETED duration (endDate - startDate) in seconds, within
  // range — null when there's nothing completed yet to average.
  avgDurationSeconds: number | null;
  dailyTrend: { date: string; completed: number; failed: number }[];
  topOperators: {
    userId: string;
    fullName: string;
    completedCount: number;
    avgDurationSeconds: number | null;
  }[];
  topLocations: { code: string; count: number }[];
}

// One row of raw activity within a shift window — the shared input both
// the Operator Duration and Trolley Supply Frequency summary use-cases
// aggregate from (see utils/trolley-shift-summary.util.ts).
export interface ShiftActivityRow {
  trolleyId: string;
  trolleyCode: string;
  trolleyName: string;
  userId: string;
  userFullName: string;
  roleName: string;
  status: TaskStatus;
  startDate: Date;
  endDate: Date | null;
  // Which node the operator scanned to start this activity — a Warehouse
  // Location code ("Dealer" direction, Warehouse -> Production) or a
  // Production Location code ("Supply" direction, Production ->
  // Warehouse). See utils/trolley-shift-summary.util.ts's
  // splitRowsByDirection for how this is classified.
  pickupLocationCode: string;
}

export interface ITrolleyActivitiesRepository {
  create(
    data: CreateTrolleyActivityData,
  ): Promise<TrolleyActivityWithRelations>;
  // Take Trolley's write — creates the open row described above.
  createOpen(
    data: CreateOpenTrolleyActivityData,
  ): Promise<TrolleyActivityWithRelations>;
  // The most recent open (statusEnd still null) row for this trolley, if
  // any — Drop Trolley completes this instead of creating a new row when
  // one exists.
  findOpenByTrolleyId(
    trolleyId: string,
  ): Promise<TrolleyActivityWithRelations | null>;
  // Drop Trolley's write onto a previously-open row.
  completeById(
    id: string,
    data: CompleteTrolleyActivityData,
  ): Promise<TrolleyActivityWithRelations>;
  softDelete(id: string): Promise<void>;
  findById(id: string): Promise<TrolleyActivityWithRelations | null>;
  findAll(
    params: FindAllTrolleyActivitiesParams,
  ): Promise<FindAllTrolleyActivitiesResult>;
  countByUserUpTo(userId: string, createdAt: Date): Promise<number>;
  updateStatusByTaskId(
    taskId: string,
    status: TaskStatus,
    robotId?: string,
  ): Promise<boolean>;
  findActiveByRobot(): Promise<ActiveTrolleyActivityByRobot[]>;
  // PENDING/IN_PROGRESS activities the given user submitted, excluding open
  // (statusEnd still null, Take Trolley only) rows — lets the
  // Warehouse/Operator Trolley Task page restore its Current Queue cards
  // after a page reload (Pinia's in-memory queue doesn't survive that).
  findActiveByUser(userId: string): Promise<TrolleyActivityWithRelations[]>;
  /**
   * The taskId of an active (PENDING/IN_PROGRESS) Trolley Task whose
   * trolley's currentLocationCode matches — set immediately at submit time
   * to wherever the task is headed (the trolley's own fixed dropping code
   * for Warehouse->Production, or the auto-picked Warehouse Location for
   * Production->Warehouse — see CreateTrolleyActivityUseCase). Used to
   * block a Warehouse Trolley Task pickup scan on a node an AMR is still en
   * route to deliver something at (see LookupLocationUseCase) — matching
   * off currentLocationCode rather than TrolleyActivity.droppingLocationCode
   * since the latter is deliberately left blank for Production->Warehouse
   * activities until they're confirmed complete, i.e. exactly while they're
   * still "active" and this needs to catch them.
   */
  findActiveTaskIdByLocationCode(code: string): Promise<string | null>;
  getDashboardStats(
    params: DashboardStatsParams,
  ): Promise<DashboardStatsResult>;
  // Raw activity rows starting within [from, to) — the shared source for
  // the Operator Duration and Trolley Supply Frequency shift charts (see
  // utils/trolley-shift-summary.util.ts for the aggregation on top).
  getShiftActivities(from: Date, to: Date): Promise<ShiftActivityRow[]>;
}
