import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { ProductInventoryModule } from 'src/product-inventory/product-inventory.module';
import { PharmacyModule } from 'src/pharmacy/pharmacy.module';
import { OrderDetail } from './entities/order-details.entity';
import { StoreModule } from 'src/store/store.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderDetail]),
    ProductInventoryModule,
    PharmacyModule,
    StoreModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
