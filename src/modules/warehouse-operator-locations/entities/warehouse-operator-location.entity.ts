import { ApiProperty } from '@nestjs/swagger';

class WarehouseOperatorEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;
}

export class WarehouseOperatorLocationEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  locationCode!: string;

  @ApiProperty()
  operatorId!: string;

  @ApiProperty({ type: WarehouseOperatorEntity })
  operator!: WarehouseOperatorEntity;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}
