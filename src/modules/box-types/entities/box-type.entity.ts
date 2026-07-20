import { ApiProperty } from '@nestjs/swagger';
import { FromSystem } from '@prisma/client';

export class BoxTypeEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  ordering!: number;

  @ApiProperty()
  colorCode!: string;

  @ApiProperty()
  modelProcessCode!: string;

  @ApiProperty({ enum: FromSystem })
  fromSystem!: FromSystem;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}
