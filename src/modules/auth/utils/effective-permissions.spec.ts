import { resolveEffectivePermissions } from './effective-permissions';

describe('resolveEffectivePermissions', () => {
  it('drops writes whose resource read was not granted', () => {
    const result = resolveEffectivePermissions([
      'production-location.create',
      'production-location.update',
      'production-location.delete',
    ]);

    expect(result).toEqual([]);
  });

  it('keeps writes once the matching read is granted', () => {
    const result = resolveEffectivePermissions([
      'production-location.read',
      'production-location.create',
      'production-location.delete',
    ]);

    expect(result.sort()).toEqual([
      'production-location.create',
      'production-location.delete',
      'production-location.read',
    ]);
  });

  it("grants the Dashboard's widget reads to a dashboard-only role", () => {
    const result = resolveEffectivePermissions(['dashboard.read']);

    expect(result).toEqual(
      expect.arrayContaining([
        'dashboard.read',
        'robot.read',
        'robot-alarm.read',
        'factory-map.read',
        'trolley-activity.read',
        'charger-area.read',
        'shift.read',
      ]),
    );
  });

  it("does not let an implied read unlock that resource's writes", () => {
    const result = resolveEffectivePermissions([
      'dashboard.read',
      'robot.create',
    ]);

    expect(result).toContain('robot.read');
    expect(result).not.toContain('robot.create');
  });

  it('is idempotent', () => {
    const once = resolveEffectivePermissions([
      'dashboard.read',
      'robot.create',
      'user.read',
      'user.update',
    ]);

    expect(resolveEffectivePermissions(once).sort()).toEqual(once.sort());
  });
});
