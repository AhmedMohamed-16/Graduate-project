import { Module } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service' 
import { PharmacyController } from './pharmacy.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pharmacy } from './entities/pharmacy.entity';
import { PharmacistModule } from 'src/pharmacist/pharmacist.module';
import { OrderModule } from 'src/order/order.module';
import { OrderService } from 'src/order/order.service';
import { Order } from 'src/order/entities/order.entity';
import { OrderDetail } from 'src/order/entities/order-details.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pharmacy]), PharmacistModule],
  controllers: [PharmacyController],
  providers: [PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
