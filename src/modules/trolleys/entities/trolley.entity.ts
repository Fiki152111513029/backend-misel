import { ApiProperty } from '@nestjs/swagger';
import { TrolleyStatus } from '@prisma/client';

export class TrolleyEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ enum: TrolleyStatus })
  status!: TrolleyStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}
