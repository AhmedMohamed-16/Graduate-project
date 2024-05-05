import { Module } from '@nestjs/common';
import { ProductInventoryService } from './product-inventory.service';
import { ProductInventoryController } from './product-inventory.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductInventory } from './entities/product-inventory.entity';
import { ProductModule } from 'src/product/product.module';
import { StoreModule } from 'src/store/store.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductInventory]),
    ProductModule,
    StoreModule,
  ],
  controllers: [ProductInventoryController],
  providers: [ProductInventoryService],
})
export class ProductInventoryModule {}
