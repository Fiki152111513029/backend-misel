import { ApiProperty } from '@nestjs/swagger';
import { WarehouseCartTaskStatus } from '@prisma/client';

class NamedRefEntity {
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

  @ApiProperty()
  fullName!: string;
}

export class WarehouseCartTaskEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  taskId!: string;

  @ApiProperty()
  taskPath!: string;

  @ApiProperty({ enum: WarehouseCartTaskStatus })
  status!: WarehouseCartTaskStatus;

  @ApiProperty()
  warehouseLineLocationId!: string;

  @ApiProperty({ type: NamedRefEntity })
  warehouseLineLocation!: NamedRefEntity;

  @ApiProperty()
  modelCodeProcessId!: string;

  @ApiProperty({ type: NamedRefEntity })
  modelCodeProcess!: NamedRefEntity;

  @ApiProperty({ nullable: true })
  robotId!: string | null;

  @ApiProperty({ type: NamedRefEntity, nullable: true })
  robot!: NamedRefEntity | null;

  @ApiProperty()
  operatorId!: string;

  @ApiProperty({ type: OperatorRefEntity })
  operator!: OperatorRefEntity;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}
