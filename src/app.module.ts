import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AdminModule } from './admin/admin.module';
import { StoreModule } from './store/store.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { AuthModule } from './auth/auth.module';
import { PharmacistModule } from './pharmacist/pharmacist.module';
import { UploadModule } from './upload/upload.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { ProductInventoryModule } from './product-inventory/product-inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLER_TTL'),
          limit: config.get<number>('THROTTLER_LIMIT'),
        },
      ],
    }),

    DatabaseModule,
    AdminModule,
    StoreModule,
    PharmacyModule,
    AuthModule,
    PharmacistModule,
    UploadModule,
    CategoryModule,
    ProductModule,
    ProductInventoryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
