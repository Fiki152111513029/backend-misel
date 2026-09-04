import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AlarmDashboardStatsQueryDto {
  @ApiPropertyOptional({
    example: 2,
    minimum: 1,
    maximum: 60,
    default: 2,
    description:
      'How many minutes back (from now) to aggregate alarm stats over — this is a live/current snapshot, not a historical count, so a robot with no fresh alarm inside this window reads as 0 rather than carrying an old count forward.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  minutes: number = 2;
}
