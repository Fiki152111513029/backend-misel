import { Inject, Injectable } from '@nestjs/common';
import { ROBOT_ALARMS_REPOSITORY } from '../repositories/robot-alarm-repository.interface';
import type { IRobotAlarmsRepository } from '../repositories/robot-alarm-repository.interface';

// deviceName (same value as Robot.amrDeviceSerialNo, e.g. "AMR0004") of
// every device currently sitting in an active, unresolved alarm — powers
// the Factory Map's live alarm badge, which stays up on a robot until RCS
// reports that alarm resolved.
@Injectable()
export class GetActiveAlarmDeviceNamesUseCase {
  constructor(
    @Inject(ROBOT_ALARMS_REPOSITORY)
    private readonly robotAlarmsRepository: IRobotAlarmsRepository,
  ) {}

  execute(): Promise<string[]> {
    return this.robotAlarmsRepository.findActiveDeviceNames();
  }
}
