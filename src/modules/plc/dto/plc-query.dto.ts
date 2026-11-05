import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

class PaginationDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}

export class PlcDeviceQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by name or host' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['name', 'host', 'createdAt'], default: 'name' })
  @IsOptional()
  @IsIn(['name', 'host', 'createdAt'])
  sortBy: 'name' | 'host' | 'createdAt' = 'name';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'asc';
}

export class PlcTagQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Only this device' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  // Address first by default: a tag list is read in address order, so the
  // screen matches the document it was copied from.
  @ApiPropertyOptional({
    enum: ['name', 'address', 'createdAt'],
    default: 'address',
  })
  @IsOptional()
  @IsIn(['name', 'address', 'createdAt'])
  sortBy: 'name' | 'address' | 'createdAt' = 'address';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'asc';
}

export class PlcReadingQueryDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Only this tag' })
  @IsOptional()
  @IsUUID()
  tagId?: string;

  @ApiPropertyOptional({ example: '2026-11-04', description: 'Single day' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date?: string;
}
