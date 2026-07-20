import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ReleaseWarehouseCartTaskDto {
  @ApiProperty({ example: 'b3f1c2e4-...' })
  @IsUUID()
  warehouseLineLocationId!: string;
}
