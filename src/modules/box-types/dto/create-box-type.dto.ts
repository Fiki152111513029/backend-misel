import { ApiProperty } from '@nestjs/swagger';
import { FromSystem } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBoxTypeDto {
  @ApiProperty({ example: 'Small Box', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 1, minimum: 0 })
  @IsInt()
  @Min(0)
  ordering!: number;

  @ApiProperty({ example: '#FF0000', description: 'HEX color, e.g. #FF0000' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'colorCode must be a valid HEX color, e.g. #FF0000',
  })
  colorCode!: string;

  @ApiProperty({
    example: 'liftshelf122',
    maxLength: 100,
    description: 'modelProcessCode sent to the AMR task order endpoint',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  modelProcessCode!: string;

  @ApiProperty({ enum: FromSystem, example: FromSystem.MES })
  @IsEnum(FromSystem)
  fromSystem!: FromSystem;
}
