import type { LineStatusWithRaiser } from '../repositories/line-status-repository.interface';

/**
 * The shape Checking Area reads.
 *
 * Deliberately just the facts — which line, which of the four things it is
 * saying, who said it and when. The sentence ("WRL31 SEDANG RUNNING LH") is
 * written by the page, the same way warehouse notices are worded there, so
 * rewording it never needs a backend deploy.
 */
export interface LineStatusResponse {
  groupName: string;
  kind: string;
  raisedBy: string | null;
  at: string;
}

export function toLineStatusResponse(
  status: LineStatusWithRaiser,
): LineStatusResponse {
  return {
    groupName: status.groupName,
    kind: status.kind,
    raisedBy: status.raisedBy?.fullName ?? null,
    // updatedAt, not createdAt: the row is replaced in place on every
    // press, so createdAt is when the line first ever announced anything.
    at: status.updatedAt.toISOString(),
  };
}
