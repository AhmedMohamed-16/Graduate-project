import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { StoreModule } from './store/store.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { AuthModule } from './auth/auth.module';
import { PharmacistModule } from './pharmacist/pharmacist.module';
import { UploadModule } from './upload/upload.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { ProductInventoryModule } from './product-inventory/product-inventory.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
  providers: [AppService, ],
})
export class AppModule {}
