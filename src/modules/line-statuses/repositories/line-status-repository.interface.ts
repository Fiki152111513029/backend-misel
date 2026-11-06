import { LineStatus, LineStatusKind } from '@prisma/client';

export type LineStatusWithRaiser = LineStatus & {
  raisedBy: { id: string; username: string; fullName: string } | null;
};

export const LINE_STATUSES_REPOSITORY = 'LINE_STATUSES_REPOSITORY';

export interface ILineStatusesRepository {
  /**
   * Every line that has announced something, newest first.
   *
   * Not paginated: there is one row per production line, and a factory has
   * tens of those, not thousands.
   */
  findAll(): Promise<LineStatusWithRaiser[]>;
  /**
   * Replace what this line is saying. Upsert rather than insert — the row
   * is the line's current state, so the newest press overwrites the last
   * one whatever kind it was.
   */
  upsert(
    groupName: string,
    kind: LineStatusKind,
    raisedById: string | null,
  ): Promise<LineStatusWithRaiser>;
  /** The line is no longer saying anything. Silent if there was no row. */
  clear(groupName: string): Promise<void>;
}
