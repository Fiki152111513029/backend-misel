import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class ControlRobotDto {
  @ApiProperty({ enum: [0, 1], description: '0 = Suspend, 1 = Restore' })
  @IsIn([0, 1])
  controlWay!: 0 | 1;
}
