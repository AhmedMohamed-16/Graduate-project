import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { UserType } from "src/common/enums/user-type.enum";

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    userName: string;
  
    @IsString()
    @IsNotEmpty()
    password: string;
  
    @IsEnum(UserType)
    @IsNotEmpty()
    userType: UserType;
  }