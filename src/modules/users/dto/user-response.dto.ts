import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  username!: string;

  @Expose()
  @ApiProperty({ nullable: true })
  email!: string | null;

  @Expose()
  @ApiProperty()
  fullName!: string;

  @Expose()
  @ApiProperty()
  roleId!: string;

  @Expose()
  @ApiProperty()
  isActive!: boolean;

  @Expose()
  @ApiProperty({
    enum: [4, 6, 8],
    description: '4 = High, 6 = Medium, 8 = Low',
  })
  priority!: number;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
