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
  /** RCS pushed a new AGV report to /agv-logs. */
  'agv-logs',
  /** An admin changed wording or configuration in App Settings. */
  'settings',
  /** A PLC device or tag was added, edited or removed. */
  'plc',
  /**
   * A production line announced something about itself, or the warehouse
   * cleared it — the four buttons at the foot of a Custom Task group.
   *
   * A signal rather than a data channel, unlike a warehouse notice: this
   * one is stored, so there is an endpoint to refetch.
   */
  'line-status',
] as const;

export type RealtimeTopic = (typeof REALTIME_TOPICS)[number];
