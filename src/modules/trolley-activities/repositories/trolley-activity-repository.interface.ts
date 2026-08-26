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

// What a repeated Take Trolley (same trolley, still-open row from an
// earlier Take Trolley) writes onto that row instead of creating a second
// one — refreshes it as if this were the first Take Trolley.
export interface RefreshOpenTrolleyActivityData {
  statusBeginning: TrolleyStatus;
  pickupLocationCode: string;
  queueRole: string;
  startDate: Date;
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
  // A repeated Take Trolley's write onto its own still-open row, instead of
  // creating a second one (see RefreshOpenTrolleyActivityData).
  refreshOpenById(
    id: string,
    data: RefreshOpenTrolleyActivityData,
  ): Promise<TrolleyActivityWithRelations>;
  // Admin override for a row stuck PENDING/IN_PROGRESS forever because its
  // RCS completion webhook never arrived (or, for an open row, because Drop
  // Trolley was never submitted for it) — manually closes it out so it
  // stops showing as an in-flight task (e.g. the "AMR incoming" warning on
  // the location scan step keys off exactly this: PENDING/IN_PROGRESS rows
  // whose trolley.currentLocationCode matches the scanned node).
  markFailedById(id: string): Promise<TrolleyActivityWithRelations>;
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
   * The trolley of an active (PENDING/IN_PROGRESS) Trolley Task currently
   * heading to this location, if any — warns an operator scanning a node
   * that already has an AMR incoming. Matches off Trolley.currentLocationCode
   * (set immediately at submit time), not TrolleyActivity.droppingLocationCode,
   * since the latter is deliberately left blank for Production->Warehouse
   * activities until they're confirmed complete.
   */
  findActiveIncomingByLocationCode(
    code: string,
  ): Promise<{ trolleyCode: string; trolleyName: string } | null>;
}
