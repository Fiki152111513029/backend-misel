import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateAppSettingsDto {
  // Validated against the known key list in the use-case rather than by a
  // fixed shape here, so adding a setting does not mean editing this DTO.
  @ApiProperty({
    example: { 'bin.label.full': 'Rak Kosong Ready' },
    description: 'Partial map of setting key to new value',
  })
  @IsObject()
  settings!: Record<string, string>;
}
