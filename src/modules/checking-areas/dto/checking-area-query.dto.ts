import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class CheckingAreaQueryDto {
  @ApiProperty({
    example: 1,
    description:
      'Factory Map areaNumber — the area whose bins RCS should be asked about',
  })
  @Type(() => Number)
  @IsInt()
  areaId!: number;
}
