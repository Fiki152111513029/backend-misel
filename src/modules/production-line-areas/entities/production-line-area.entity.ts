import { ApiProperty } from '@nestjs/swagger';
import { ProductionLineAreaType } from '@prisma/client';

class NamedRefEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class ProductionLineAreaEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ProductionLineAreaType })
  type!: ProductionLineAreaType;

  @ApiProperty()
  iRaypleLocationCode!: string;

  @ApiProperty()
  productionLineId!: string;

  @ApiProperty({ type: NamedRefEntity })
  productionLine!: NamedRefEntity;

  @ApiProperty()
  eximLocationId!: string;

  @ApiProperty({ type: NamedRefEntity })
  eximLocation!: NamedRefEntity;

  @ApiProperty()
  emptyPalletLocationId!: string;

  @ApiProperty({ type: NamedRefEntity })
  emptyPalletLocation!: NamedRefEntity;

  @ApiProperty({ nullable: true })
  modelCodeProcessId!: string | null;

  @ApiProperty({ type: NamedRefEntity, nullable: true })
  modelCodeProcess!: NamedRefEntity | null;

  @ApiProperty()
  order!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}
