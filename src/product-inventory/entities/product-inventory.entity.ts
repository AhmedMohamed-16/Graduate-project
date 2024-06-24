import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Product } from 'src/product/entities/product.entity';
import { Store } from 'src/store/entities/store.entity';
import { OrderDetail } from 'src/order/entities/order-details.entity';

@Entity()
export class ProductInventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  amount: number;

  @Column({ nullable: false })
  offerPercent: number;

  @CreateDateColumn({ nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
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
