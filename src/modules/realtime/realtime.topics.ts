/**
 * What a client can be told has changed.
 *
 * These are deliberately coarse "something in here moved" signals, not the
 * data itself: the client refetches the endpoint it already uses, so every
 * payload shape, permission check and query parameter stays in one place
 * (the REST layer) instead of being duplicated over the socket. The win is
 * that it refetches when something actually happened rather than every few
 * seconds.
 */
export const REALTIME_TOPICS = [
  /** Robot telemetry refreshed — position, battery, state, speed. */
  'robots',
  /** A task of any kind changed status (the RCS task-status webhook). */
  'tasks',
  /** A device alarm was raised or resolved. */
  'alarms',
  /** A Custom Task was released or cancelled. */
  'custom-tasks',
  /** A Trolley Task was taken, dropped or completed. */
  'trolley-activities',
  /** A Warehouse/Production Location bin status changed in RCS. */
  'stock',
] as const;

export type RealtimeTopic = (typeof REALTIME_TOPICS)[number];
