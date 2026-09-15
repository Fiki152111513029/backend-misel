import { Injectable } from '@nestjs/common';
import {
  RobotAlarmDetailResponse,
  RobotAlarmDetailService,
} from '../services/robot-alarm-detail.service';

@Injectable()
export class GetRobotAlarmDetailUseCase {
  constructor(
    private readonly robotAlarmDetailService: RobotAlarmDetailService,
  ) {}

  async execute(deviceCode: string): Promise<RobotAlarmDetailResponse> {
    return this.robotAlarmDetailService.fetchDetail(deviceCode);
  }
}
