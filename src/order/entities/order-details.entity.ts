import { Column, Entity, JoinTable, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";
import { ProductInventory } from "src/product-inventory/entities/product-inventory.entity";
  
@Entity()
export class OrderDetail{

    @PrimaryGeneratedColumn()
    id: number;
  
   @ManyToOne(() => Order, (order:Order) => order.orderDetail)
   order:Order;
  
   @JoinTable()
   @ManyToOne(() => ProductInventory, (productInventory:ProductInventory) => productInventory.orderDetail, {
      cascade: true,
   })
   productInventory:ProductInventory;
   
   
   @Column({ type: 'decimal', precision: 10, scale: 2 })
   price: number;
   @Column()
   quantity: number;

   
}