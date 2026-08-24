import { ApiProperty } from '@nestjs/swagger';

class TrolleyCategoryModelCodeProcessEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  fromSystem!: string;
}

export class TrolleyCategoryEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  modelCodeProcessId!: string | null;

  @ApiProperty({ type: TrolleyCategoryModelCodeProcessEntity, nullable: true })
  modelCodeProcess!: TrolleyCategoryModelCodeProcessEntity | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}
