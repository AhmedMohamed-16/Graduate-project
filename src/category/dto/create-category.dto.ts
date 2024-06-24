import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Length(1, 30)
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description: string;
}
