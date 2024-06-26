import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateStoreDto {
  // Store Information
  @ApiProperty()
  @IsString()
  @Length(1, 30)
  storeName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  governorate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  region: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString({ each: true })
  contactNumber: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString({ each: true })
  email: string;

  // Legal Information
  @ApiProperty({ description: 'Should be file' })
  @IsOptional()
  taxLicense: string;

  @ApiProperty({ description: 'Should be file' })
  @IsOptional()
  taxCard: string;

  @ApiProperty({ description: 'Should be file' })
  @IsOptional()
  commercialRegister: string;

  // Account Authentication
  @ApiProperty()
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(5, 30)
  userName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;
}
