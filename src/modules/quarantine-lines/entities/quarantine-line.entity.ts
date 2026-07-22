import { ApiProperty } from '@nestjs/swagger';

class ModelCodeProcessRefEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class QuarantineLineEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ nullable: true })
  modelCodeProcessId!: string | null;

  @ApiProperty({ type: ModelCodeProcessRefEntity, nullable: true })
  modelCodeProcess!: ModelCodeProcessRefEntity | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}
