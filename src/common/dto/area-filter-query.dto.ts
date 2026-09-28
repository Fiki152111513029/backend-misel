import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

/**
 * The Dashboard shows one Factory Map at a time, and its panels are meant to
 * describe that floor rather than the whole site. Passing the map's
 * `areaNumber` here narrows a robot-derived endpoint to the robots stationed
 * in that area; leaving it out keeps the old site-wide behaviour, which is
 * what every non-Dashboard caller still wants.
 */
export class AreaFilterQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Factory Map areaNumber — omit for every area',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  areaId?: number;
}
