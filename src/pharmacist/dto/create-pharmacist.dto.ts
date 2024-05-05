import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePharmacistDto {
  // Legal Information
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  // Personal Information
  @ApiProperty()
  @IsOptional()
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  firstName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  phoneNumber?: string;
}
