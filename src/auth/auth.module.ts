import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AdminModule } from 'src/admin/admin.module';
import { PharmacyModule } from 'src/pharmacy/pharmacy.module';
import { StoreModule } from 'src/store/store.module';
import { ConfigService } from '@nestjs/config';
import { PharmacistModule } from 'src/pharmacist/pharmacist.module';
import { UploadModule } from 'src/upload/upload.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt-stategy.strategy';

@Module({
  imports: [
    AdminModule,
    PharmacyModule,
    PharmacistModule,
    StoreModule,
    UploadModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: configService.get('JWT_SIGN_OPTIONS'),
      }),
    }),
  ],
  providers: [AuthService,JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
