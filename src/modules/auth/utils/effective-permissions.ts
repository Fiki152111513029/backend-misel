// Permission codes are always "<resource>.<action>" (see prisma/seed.ts),
// with read/create/update/delete as the actions. What a role is *granted* in
// the Roles screen isn't quite what it can actually do — two rules apply on
// top, both resolved here so the guard, the JWT payload and the buttons the
// frontend renders can never disagree about them.

const WRITE_ACTIONS = ['create', 'update', 'delete'];

// Granting dashboard.read means "can see the Dashboard", and the Dashboard
// is built entirely out of other modules' data (Fleet Status, Factory Map,
// alarms, trolley activity, chargers, the AMR Performance chart's shift
// filter). Without this, a Dashboard-only role loads the page and every
// widget 403s. These are read-only — they never unlock writes (see below).
const IMPLIED_READS: Record<string, string[]> = {
  'dashboard.read': [
    'robot.read',
    'robot-alarm.read',
    'factory-map.read',
    'trolley-activity.read',
    'charger-area.read',
    'shift.read',
  ],
};

/**
 * The permissions a role can actually act on:
 *
 * 1. dashboard.read pulls in the reads its widgets need (IMPLIED_READS).
 * 2. A write (create/update/delete) needs its own resource's read to have
 *    been granted explicitly — ticking "Create Production Location" without
 *    "Read Production Location" does nothing, since you can't act on a list
 *    you can't load. An implied read is deliberately not enough here: seeing
 *    robots on the Dashboard shouldn't quietly enable creating them.
 *
 * Idempotent — running it over an already-resolved list returns the same set.
 */
export function resolveEffectivePermissions(granted: string[]): string[] {
  const grantedSet = new Set(granted);

  const effective = new Set(granted);
  for (const [trigger, implied] of Object.entries(IMPLIED_READS)) {
    if (!grantedSet.has(trigger)) continue;
    for (const code of implied) effective.add(code);
  }

  for (const code of effective) {
    const separator = code.lastIndexOf('.');
    if (separator < 0) continue;
    const resource = code.slice(0, separator);
    const action = code.slice(separator + 1);
    if (!WRITE_ACTIONS.includes(action)) continue;
    if (!grantedSet.has(`${resource}.read`)) effective.delete(code);
  }

  return [...effective];
}
