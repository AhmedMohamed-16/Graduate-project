import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { CreatePharmacistDto } from '../../pharmacist/dto/create-pharmacist.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePharmacyDto { 
  // Pharmacy Information
  @ApiProperty()
  @IsString()
  @Length(1, 30)
  pharmacyName: string;

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

  // Legal Information
  @IsNotEmpty()
  @IsNumber()
  licenseNumber: number;

  @ApiProperty({description:'Should be file'})
  @IsOptional()
  pharmacyPhoto: string;

  @ApiProperty({description:'Should be file'})
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

  // Related Entities
  @ApiProperty()
  @ValidateNested()
  @Type(() => CreatePharmacistDto)
  pharmacist: CreatePharmacistDto; // Pharmacist data
  
  @ApiProperty({description:"updated for only admin"})
  @IsBoolean()
  isActive?: boolean;
}
