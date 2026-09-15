import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RobotAlarmDetailRequestDto {
  @ApiProperty({
    example: 'AMR0002',
    description:
      "The alarm-emitting device's code — the same identifier stored as RobotAlarm.deviceName (and matched against Robot.amrDeviceSerialNo elsewhere in the app).",
  })
  @IsString()
  @IsNotEmpty()
  deviceCode!: string;
}
