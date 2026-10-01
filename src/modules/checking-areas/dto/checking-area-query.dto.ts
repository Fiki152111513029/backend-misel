import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class CheckingAreaQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description:
      'Factory Map areaNumber to narrow the RCS lookup to. Omit to ask every area and merge the answers — a Warehouse Location carries no area of its own.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  areaId?: number;
}
