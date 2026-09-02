export type RobotStatusCategory = 'RUNNING' | 'IDLE' | 'CHARGING';

// Buckets the free-text `state` reported by the AMR telemetry API (Idle,
// Initializing, In task, Fault, Offline, Charging, Upgrading — casing and
// spacing vary, see RobotTelemetryService/GetFleetStatusUseCase) into the
// three categories the AMR Performance chart shows. Everything that isn't
// clearly "running a task" or "charging" — Idle, Initializing, Fault,
// Offline, Upgrading, and anything unrecognized — counts as Idle, so a
// robot's three buckets always sum to a full day.
export function toRobotStatusCategory(
  rawState: string | null,
): RobotStatusCategory {
  const value = rawState?.toLowerCase() ?? '';
  if (value.includes('charg')) return 'CHARGING';
  if (value.includes('task')) return 'RUNNING';
  return 'IDLE';
}
