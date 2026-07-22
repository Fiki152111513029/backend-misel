import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WarehouseCartTaskStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import type {
  SortOrder,
  WarehouseCartTaskSortBy,
} from '../repositories/warehouse-cart-task-repository.interface';

export class WarehouseCartTaskQueryDto {
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

  @ApiPropertyOptional({ enum: ['createdAt'], default: 'createdAt' })
  @IsOptional()
  @IsIn(['createdAt'])
  sortBy: WarehouseCartTaskSortBy = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: SortOrder = 'desc';

  @ApiPropertyOptional({ description: 'ISO datetime — createdAt lower bound' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'ISO datetime — createdAt upper bound' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by the operator who released the cart task' })
  @IsOptional()
  @IsUUID()
  operatorId?: string;

  @ApiPropertyOptional({ enum: WarehouseCartTaskStatus })
  @IsOptional()
  @IsEnum(WarehouseCartTaskStatus)
  status?: WarehouseCartTaskStatus;
}
