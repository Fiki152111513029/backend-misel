import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID, Matches } from 'class-validator';

export class TrolleyShiftSummaryQueryDto {
  @ApiProperty({
    example: '2026-05-24',
    description: 'Calendar day (UTC) to summarize, as YYYY-MM-DD',
  })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date!: string;

  @ApiPropertyOptional({
    example: 'b3f1c2e4-...',
    description:
      'Shift id (see GET /shifts). Omit for every shift — the whole UTC day, with no assigned-shift filter on the operators — which is also the only option when no Shift has been configured.',
  })
  @IsOptional()
  @IsUUID()
  shiftId?: string;
}
