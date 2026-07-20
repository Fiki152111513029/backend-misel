import { ApiProperty } from '@nestjs/swagger';

export class QuarantineAreaEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  iRaypleLocationCode!: string;

  @ApiProperty()
  quarantineLineId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}
