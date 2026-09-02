export type RobotStatusCategory = 'RUNNING' | 'IDLE' | 'CHARGING';

// Buckets the free-text `state` reported by the AMR telemetry API (Idle,
// Initializing, In task, Fault, Offline, Charging, Upgrading — casing and
// spacing vary, see RobotTelemetryService/GetFleetStatusUseCase) into the
// three categories the AMR Performance chart shows. Initializing, Fault,
// Upgrading, and anything unrecognized count as Idle. Offline is excluded
// entirely (null) — a robot that's offline isn't idle-and-available, it's
// simply not being tracked for that stretch of time, so it doesn't add to
// any of the three buckets.
export function toRobotStatusCategory(
  rawState: string | null,
): RobotStatusCategory | null {
  const value = rawState?.toLowerCase() ?? '';
  if (value.includes('offline')) return null;
  if (value.includes('charg')) return 'CHARGING';
  if (value.includes('task')) return 'RUNNING';
  return 'IDLE';
}
