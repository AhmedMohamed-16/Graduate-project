import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Should be file' })
  @IsOptional()
  image: string;

  @ApiProperty() // Specify the category as a number
  @IsNotEmpty()
  @IsNumber()
  categoryID: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  publicPrice: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  unitsPerPackage: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  activeIngredientInEachTablet?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  activeIngredient: string[];

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  therapeuticClass: string[];
}
