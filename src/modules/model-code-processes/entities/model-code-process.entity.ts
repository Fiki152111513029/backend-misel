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
  statusComment1!: string;

  @ApiProperty()
  statusComment2!: string;

  @ApiProperty()
  statusComment3!: string;

  @ApiProperty()
  statusComment4!: string;

  @ApiProperty()
  statusComment5!: string;

  @ApiProperty()
  statusComment6!: string;

  @ApiProperty()
  statusComment7!: string;

  @ApiProperty()
  statusComment8!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}
