import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class TrolleyActivityDashboardQueryDto {
  @ApiPropertyOptional({
    example: 7,
    minimum: 1,
    maximum: 90,
    default: 7,
    description: 'How many days back (from today) to aggregate stats over',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days: number = 7;
}
