import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateFactoryMapDto } from './create-factory-map.dto';

export class UpdateFactoryMapDto extends PartialType(CreateFactoryMapDto) {
  @ApiPropertyOptional({
    example: 'true',
    description:
      'Drop this map\'s background image and keep only the topology. Ignored when a replacement image is uploaded in the same request.',
  })
  @IsOptional()
  // Multipart carries no types, so the flag arrives as the string "true".
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  removeImage?: boolean;
}
