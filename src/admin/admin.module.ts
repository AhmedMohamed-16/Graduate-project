import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
 
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
 

@Module({
  imports: [TypeOrmModule.forFeature([Admin])],
  controllers: [AdminController],
 
  
  providers: [
    AdminService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ], 
  exports: [AdminService],
})
export class AdminModule {}
