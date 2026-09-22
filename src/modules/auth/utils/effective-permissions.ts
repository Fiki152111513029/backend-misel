// Permission codes are always "<resource>.<action>" (see prisma/seed.ts),
// with read/create/update/delete as the actions. What a role is *granted* in
// the Roles screen isn't quite what it can actually do — two rules apply on
// top, and they deliberately apply to different audiences:
//
//   resolveGrantedPermissions() — what the role really holds. This is what
//   goes in the JWT and to the frontend, which uses it to decide which
//   sidebar menus, routes and Add/Edit/Delete buttons exist.
//
//   resolveEffectivePermissions() — the above plus the reads a granted page
//   implicitly needs to render. API-side only (PermissionsGuard): it must
//   never reach the frontend, or menus the admin never ticked would appear.

const WRITE_ACTIONS = ['create', 'update', 'delete'];

// Granting dashboard.read means "can see the Dashboard", and the Dashboard is
// built entirely out of other modules' data (Fleet Status, Factory Map,
// alarms, trolley activity, chargers, the AMR Performance chart's shift
// filter). Without this, a Dashboard-only role loads the page and every
// widget 403s. It only unlocks those GETs — it never adds a sidebar menu
// (the frontend never sees these) and never unlocks writes (see below).
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
 * Drops writes whose own resource read wasn't granted — ticking "Create
 * Production Location" without "Read Production Location" does nothing,
 * since you can't act on a list you can't load.
 *
 * Idempotent.
 */
export function resolveGrantedPermissions(granted: string[]): string[] {
  const grantedSet = new Set(granted);

  return granted.filter((code) => {
    const separator = code.lastIndexOf('.');
    if (separator < 0) return true;
    const action = code.slice(separator + 1);
    if (!WRITE_ACTIONS.includes(action)) return true;
    return grantedSet.has(`${code.slice(0, separator)}.read`);
  });
}

/**
 * What PermissionsGuard actually checks against: the granted set above, plus
 * the extra reads a granted page needs to render (IMPLIED_READS). An implied
 * read never unlocks that resource's writes — seeing robots on the Dashboard
 * shouldn't quietly enable creating them.
 *
 * Idempotent.
 */
export function resolveEffectivePermissions(granted: string[]): string[] {
  const effective = new Set(resolveGrantedPermissions(granted));
  const grantedSet = new Set(granted);

  for (const [trigger, implied] of Object.entries(IMPLIED_READS)) {
    if (!grantedSet.has(trigger)) continue;
    for (const code of implied) effective.add(code);
  }

  return [...effective];
}
