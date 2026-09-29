import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Warehouse Manager' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Manages warehouse operations' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '/dashboard/operator-trolley-task',
    description:
      'Page this role lands on right after login. Must be an in-app path starting with "/". Omit (or send null) to fall back to the built-in default for the role name.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  // An in-app route only — never an absolute URL, which would turn login
  // into an open redirect off to another site.
  @Matches(/^\/[A-Za-z0-9\-_/]*$/, {
    message:
      'landingPath must be an in-app path starting with "/" (letters, digits, - and _ only)',
  })
  landingPath?: string | null;
}
