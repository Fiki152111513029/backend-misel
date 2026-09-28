import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

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

  @ApiPropertyOptional({
    example: '2026-09-28',
    description:
      'Aggregate one single calendar day (server local time) instead of a lookback window. Takes precedence over `days` — the Dashboard uses it so its stats follow the day picker.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date?: string;
}
