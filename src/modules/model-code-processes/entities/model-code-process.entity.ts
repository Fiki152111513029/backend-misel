import { ApiProperty } from '@nestjs/swagger';
import { FromSystem } from '@prisma/client';

export class ModelCodeProcessEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: FromSystem })
  fromSystem!: FromSystem;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}
