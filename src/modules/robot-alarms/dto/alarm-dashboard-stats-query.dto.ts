import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AlarmDashboardStatsQueryDto {
  @ApiPropertyOptional({
    example: 24,
    minimum: 1,
    maximum: 720,
    default: 24,
    description: 'How many hours back (from now) to aggregate alarm stats over',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(720)
  hours: number = 24;
}
