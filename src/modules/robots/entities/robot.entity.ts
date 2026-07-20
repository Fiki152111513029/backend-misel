import { ApiProperty } from '@nestjs/swagger';

export class RobotEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  amrDeviceSerialNo!: string;

  @ApiProperty()
  amrDeviceNo!: string;

  @ApiProperty()
  areaId!: number;

  @ApiProperty({
    nullable: true,
    description:
      'Live value from the AMR telemetry API, null if the device is not reporting',
  })
  speed!: number | null;

  @ApiProperty({
    nullable: true,
    description:
      'Live value from the AMR telemetry API, null if the device is not reporting',
  })
  battery!: number | null;

  @ApiProperty({
    nullable: true,
    description:
      'Live value from the AMR telemetry API, null if the device is not reporting',
  })
  state!: string | null;

  @ApiProperty({
    nullable: true,
    description:
      'Live value from the AMR telemetry API, null if the device is not reporting',
  })
  lastUpdate!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}
