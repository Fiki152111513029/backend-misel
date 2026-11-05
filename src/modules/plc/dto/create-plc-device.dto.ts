import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePlcDeviceDto {
  @ApiProperty({ example: 'PLC Line WRL31', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  // Deliberately not validated as an IP: a PLC is just as often reached by
  // hostname, and rejecting one would send the operator looking for a
  // problem that is not there.
  @ApiProperty({ example: '10.5.5.1', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  host!: string;

  @ApiPropertyOptional({ example: 501, default: 501 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description:
      'Modbus unit/slave id. 1 for a PLC answering directly; a serial device behind a TCP gateway has its own.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(255)
  unitId?: number;

  // The floor is 200ms because below that a PLC on a shared network starts
  // refusing connections rather than answering faster, and the machine it
  // is actually running comes first.
  @ApiPropertyOptional({ example: 1000, default: 1000, minimum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(200)
  @Max(600000)
  pollIntervalMs?: number;

  @ApiPropertyOptional({ example: 2000, default: 2000, minimum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(60000)
  timeoutMs?: number;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
