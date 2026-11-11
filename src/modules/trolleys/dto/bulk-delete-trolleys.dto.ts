import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class BulkDeleteTrolleysDto {
  @ApiProperty({
    type: [String],
    example: ['0f0c2a3e-1f2a-4f3b-9c1d-2a3b4c5d6e7f'],
    description: 'Ids of the trolleys to soft delete.',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  ids!: string[];
}
