import { ApiProperty } from '@nestjs/swagger';
import { TaskAction } from '@prisma/client';

class NamedRefEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

class ProductionLineRefEntity extends NamedRefEntity {
  @ApiProperty({ type: NamedRefEntity })
  quarantineLine!: NamedRefEntity;
}

class OperatorRefEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  fullName!: string;
}

export class TaskEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  taskId!: string;

  @ApiProperty({ enum: TaskAction })
  taskAction!: TaskAction;

  @ApiProperty()
  taskPath!: string;

  @ApiProperty({
    description:
      'Our own lifecycle status, unless a live order match overrides it with the RCS OrderStatus value',
  })
  status!: string;

  @ApiProperty()
  productionLineId!: string;

  @ApiProperty({ type: ProductionLineRefEntity })
  productionLine!: ProductionLineRefEntity;

  @ApiProperty({ nullable: true })
  productionLineAreaId!: string | null;

  @ApiProperty({ type: NamedRefEntity, nullable: true })
  productionLineArea!: NamedRefEntity | null;

  @ApiProperty({ nullable: true })
  quarantineAreaId!: string | null;

  @ApiProperty({ type: NamedRefEntity, nullable: true })
  quarantineArea!: NamedRefEntity | null;

  @ApiProperty()
  boxTypeId!: string;

  @ApiProperty({ type: NamedRefEntity })
  boxType!: NamedRefEntity;

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
