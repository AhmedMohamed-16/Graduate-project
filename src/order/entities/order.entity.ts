import { StatusOrder } from "src/common/enums/status-order.enum";
import { Pharmacy } from "src/pharmacy/entities/pharmacy.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinTable, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderDetail } from "./order-details.entity";
 
import { PaymentMethod } from "src/common/enums/payment-method.entity"; 
@Entity() 
export class Order {
@PrimaryGeneratedColumn()
id:number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalCost:number;

   @Column({default:StatusOrder.ONHOLD})
   statusOrder:StatusOrder; 

   @Column({default:PaymentMethod.CASH})
   paymentMethod:PaymentMethod ; 

 
   @CreateDateColumn({
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP(6)',
    })
  createdAt:Date;
  @UpdateDateColumn({
   type: 'timestamp',
   default: () => 'CURRENT_TIMESTAMP(6)',
   onUpdate: 'CURRENT_TIMESTAMP(6)',
 })
  updatedAt:Date;

  @ManyToOne(() => Pharmacy, (pharmacy:Pharmacy) => pharmacy.order, { 
     cascade: true,
  })
  pharmacy:Pharmacy;
   
 
  @OneToMany(() =>OrderDetail, (orderDetail:OrderDetail) => orderDetail. order)
  ordersDetail:OrderDetail[]; 

}
