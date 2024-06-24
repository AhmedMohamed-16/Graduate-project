import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  // Personal Information
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  firstName: string;

  @ApiProperty()
  @IsString()
  @Length(0, 255)
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  // Authentication Information
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  userName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
