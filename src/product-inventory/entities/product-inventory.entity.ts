 
import { OrderDetail } from 'src/order/entities/order-details.entity';
 
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn ,OneToMany, CreateDateColumn, UpdateDateColumn} from 'typeorm';
import { Product } from 'src/product/entities/product.entity';
import { Store } from 'src/store/entities/store.entity';
 

@Entity()
export class ProductInventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  amount: number;

  @Column({ nullable: false })
  offerPercent: number;

 
  @Column({ nullable: false, type: 'decimal', precision: 10, scale: 2 })
  priceAfterOffer: number;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  }) 
  modifiedAt: Date;
  //price after offer

  // Relationships
  @ManyToOne(() => Product, (product) => product.productInventories, {
    cascade: true,
  })
  product: Product;

  @ManyToOne(() => Store, (store) => store.productInventories, {
    cascade: true,
  })
  store: Store;
 
  @OneToMany(() =>OrderDetail, (orderDetail:OrderDetail) => orderDetail.productInventory )
  orderDetail:OrderDetail[];
 
}
