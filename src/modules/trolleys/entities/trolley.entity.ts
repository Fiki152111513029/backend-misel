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
  trolleyTypeId!: string;

  @ApiProperty({ nullable: true })
  trolleyCategoryId!: string | null;

  @ApiProperty({ nullable: true })
  droppingLocationCode!: string | null;

  @ApiProperty({ nullable: true })
  modelCodeProcessId!: string | null;

  @ApiProperty({ nullable: true })
  customerId!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}
