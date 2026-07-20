import { ApiProperty } from '@nestjs/swagger';

class ProductionLineRefEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

class BoxTypeRefEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  colorCode!: string;
}

export class RequestBoxEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productionLineId!: string;

  @ApiProperty({ type: ProductionLineRefEntity })
  productionLine!: ProductionLineRefEntity;

  @ApiProperty()
  boxTypeId!: string;

  @ApiProperty({ type: BoxTypeRefEntity })
  boxType!: BoxTypeRefEntity;

  @ApiProperty()
  qty!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}
