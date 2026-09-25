import { ApiPropertyOptional } from '@nestjs/swagger';
import { TypeOfGoods } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import type {
  ControlTaskSortBy,
  SortOrder,
} from '../repositories/control-task-repository.interface';

export class ControlTaskQueryDto {
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

  @ApiPropertyOptional({ description: 'Search by abjad, name or route code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: TypeOfGoods })
  @IsOptional()
  @IsEnum(TypeOfGoods)
  typeOfGoods?: TypeOfGoods;

  @ApiPropertyOptional({
    enum: ['abjad', 'name', 'createdAt'],
    default: 'abjad',
  })
  @IsOptional()
  @IsIn(['abjad', 'name', 'createdAt'])
  sortBy: ControlTaskSortBy = 'abjad';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: SortOrder = 'asc';
}
