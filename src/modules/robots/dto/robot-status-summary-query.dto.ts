import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

export class RobotStatusSummaryQueryDto {
  @ApiProperty({
    example: '2026-05-24',
    description: 'Calendar day (UTC) to summarize, as YYYY-MM-DD',
  })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date!: string;
}
