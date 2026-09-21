import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateFactoryMapDto {
  @ApiProperty({ example: 'Warehouse Area 2', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 2,
    minimum: 1,
    description:
      'The areaId Robots in this area use to talk to the AMR fleet API — must be unique',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  areaNumber!: number;

  @ApiPropertyOptional({
    example: '[{"code":"TPA1CA","target":"PRODUCTION"}]',
    description:
      'JSON array of { code, target } routing type-1 rack nodes in the topology file to a Production or Warehouse Location (target: PRODUCTION | WAREHOUSE). Create only — racks not listed are not imported.',
  })
  @IsOptional()
  @IsString()
  rackAssignments?: string;
}
