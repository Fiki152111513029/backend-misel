import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class LookupTrolleyDto {
  @ApiProperty({ example: 'TRL-001' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  // Only required when the scanned code matches more than one active
  // Trolley (shared across different Trolley Types) — the first lookup call
  // (without this) reports the ambiguity, the operator picks a Type, then
  // this call resolves it.
  @ApiPropertyOptional({
    description:
      'Trolley Type id — required only to disambiguate when the scanned code matches multiple active trolleys',
  })
  @IsOptional()
  @IsUUID()
  trolleyTypeId?: string;
}
