import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AdminService } from 'src/admin/admin.service';
import { PharmacyService } from 'src/pharmacy/pharmacy.service';
import { StoreService } from 'src/store/store.service';
import { JwtService } from '@nestjs/jwt';
import { UserType } from 'src/common/enums/user-type.enum';
import { CreateAdminDto } from 'src/admin/dto/create-admin.dto';
import { CreatePharmacyDto } from 'src/pharmacy/dto/create-pharmacy.dto';
import { CreateStoreDto } from 'src/store/dto/create-store.dto';
import { CreateUserDto, User } from 'src/common/types/types';
 
import { Admin } from 'src/admin/entities/admin.entity';
import { Pharmacy } from 'src/pharmacy/entities/pharmacy.entity';
import { Store } from 'src/store/entities/store.entity';
import { randomInt } from 'crypto'; 
import * as nodemailer from 'nodemailer';
import * as Twilio from 'twilio';
import parsePhoneNumberFromString from 'libphonenumber-js';
@Injectable()
export class AuthService {
  constructor(
    private readonly adminService: AdminService,
    private readonly pharmacyService: PharmacyService,
     
    private readonly storeService: StoreService,

    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    userName: string,
    password: string,
    userType: UserType,
  ): Promise<User | null> {
    const user = await this.getUserByNameAndType(userName, userType);

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }

  private async getUserByNameAndType(
    userName: string,
    userType: UserType,
  ): Promise<User | null> {
    switch (userType) {
      case UserType.ADMIN:
        return await this.adminService.findByUserName(userName);
      case UserType.PHARMACY:
        return await this.pharmacyService.findByUserName(userName);
      case UserType.STORE:
        return await this.storeService.findByUserName(userName);
      default:
        return null;
    }
  }

 
  async register(
    createUserDto: CreateUserDto,
    userType: UserType,
  ): Promise<Admin | Pharmacy | Store> { 
    switch (userType) {
      case UserType.ADMIN:
        return await this.adminService.create(createUserDto as CreateAdminDto);

      case UserType.PHARMACY:
        return await this.pharmacyService.create(
          createUserDto as CreatePharmacyDto,
        );

      case UserType.STORE:
        return await this.storeService.create(createUserDto as CreateStoreDto);
      default:
        throw new BadRequestException('Invalid User Type');
    }
  }

  async login(user: User, userType: UserType) {
    const payload = this.getPayload(user, userType);

    return {
      ...user,
      accessToken: await this.jwtService.signAsync(payload),
      refreshToken: await this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    };
  }


  async refreshToken(user: any): Promise<{ accessToken: string }> {
    const payload = this.getPayload(user, user.payload.userType);
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  private getPayload(user: any, userType: UserType) {
    let payload = {};

    switch (userType) {
      case UserType.ADMIN:
        payload = {
          id: user.id,
          userName: user.userName,
          email: user.email,
          phone: user.phone,
          password: user.password,
          userType: UserType.ADMIN, 
        };
        break;
      case UserType.PHARMACY:
        payload = {
          id: user.id,
          userName: user.userName,
          email: user.email,
          contactNumber: user.contactNumber,
          isActive: user.isActive,
          userType: UserType.PHARMACY, 
        };
        break;
      case UserType.STORE:
        payload = {
          id: user.id,
          userName: user.userName,
          name: user.name,
          userType: UserType.STORE, 
        };
        break;
    }

    return payload;
  }
//for forget password
async requestPasswordReset(userName: string,by:string): Promise<void> {
  const user = await this.pharmacyService.findByUserName( userName );
  if (!user) {
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  const otp = randomInt(100000, 999999).toString();
  user.otp = otp;
  user.otpExpiration = new Date(Date.now() + 3600000); // 1 hour from now

  await this.pharmacyService.save(user);

  if(by=='email'){

   const transporter = nodemailer.createTransport({
    service: 'gmail', // or another email service
    auth: {
      user: 'ahmedmo567765@gmail.com',
      pass: 'hapkemhacnoawkoj'
    }
  });

  try{
    await   transporter.sendMail({
      from: 'ahmedmo567765@gmail.com',
      to:user.pharmacist.email,
      subject:"from PharmaStore check Password Reset OTP",
      text:`Your OTP is ${otp}`
    });
  }catch(error){
    console.log(error);
  }
}
else{
 
    const client = Twilio('ACd67b5a03b17060f700ccab9b4a6b4f13', 'a89aea51e7ec152afb4b50ed7028a17c');

   try{ await client.messages.create({
      from: '+12513197186',
      to:parsePhoneNumberFromString(user.pharmacist.phoneNumber, 'EG').format('E.164'),
      body:`from PharmaStore your Password Reset OTP: ${otp}`,
    });
   }
   catch(error){
    console.log(error);
  }
}
}


async verifyOtp(userName: string, otp: string, newPassword: string): Promise<void> {
  const user = await this.pharmacyService.findByUserName( userName );
  if (!user || user.otp !== otp || user.otpExpiration < new Date()) {
    throw new HttpException('Invalid or expired OTP', HttpStatus.NOT_FOUND);
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword; // Add proper password hashing here
  user.otp = null;
  user.otpExpiration = null;
  await this.pharmacyService.save(user);
}

}
