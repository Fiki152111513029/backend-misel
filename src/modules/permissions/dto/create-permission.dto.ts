import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'warehouse.read',
    description: 'Format: resource.action (resource may be hyphenated)',
  })
  @IsString()
  @Matches(/^[a-z]+(-[a-z]+)*\.[a-z]+$/, {
    message:
      'code must be in the format "resource.action" (e.g. warehouse.read, quarantine-line.read)',
  })
  code!: string;

  @ApiProperty({ example: 'Read Warehouse' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'View warehouse records' })
  @IsOptional()
  @IsString()
  description?: string;
}
