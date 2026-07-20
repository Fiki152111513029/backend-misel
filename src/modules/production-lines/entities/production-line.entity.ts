import { ApiProperty } from '@nestjs/swagger';

class QuarantineLineRefEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

class OperatorRefEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;
}

export class ProductionLineEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  quarantineLineId!: string;

  @ApiProperty({ type: QuarantineLineRefEntity })
  quarantineLine!: QuarantineLineRefEntity;

  @ApiProperty()
  operatorId!: string;

  @ApiProperty({ type: OperatorRefEntity })
  operator!: OperatorRefEntity;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}
