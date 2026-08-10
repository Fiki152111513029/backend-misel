import { ApiProperty } from '@nestjs/swagger';

export class FactoryMapEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({
    nullable: true,
    description: 'The areaId Robots in this area use to talk to the AMR fleet API',
  })
  areaNumber!: number | null;

  @ApiProperty({
    nullable: true,
    description: 'Absolute URL to the map image file, null if this map has no image',
  })
  imageUrl!: string | null;

  @ApiProperty({ description: 'Absolute URL to the map topology JSON file' })
  topologyUrl!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}
