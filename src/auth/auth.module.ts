import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AdminModule } from 'src/admin/admin.module';
import { PharmacyModule } from 'src/pharmacy/pharmacy.module';
import { StoreModule } from 'src/store/store.module';
import { ConfigService } from '@nestjs/config';
import { PharmacistModule } from 'src/pharmacist/pharmacist.module';
import { UserTypeValidationPipe } from 'src/common/pipes/user-type-validation.pipe';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [
    AdminModule,
    PharmacyModule,
    PharmacistModule,
    StoreModule,
    UploadModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: configService.get('JWT_SIGN_OPTIONS'),
      }),
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
