import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateRequestBoxDto {
  @ApiProperty({ example: 'b3f1c2e4-...' })
  @IsUUID()
  productionLineId!: string;

  @ApiProperty({ example: 'b3f1c2e4-...' })
  @IsUUID()
  boxTypeId!: string;

  @ApiProperty({ example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  qty!: number;
}
