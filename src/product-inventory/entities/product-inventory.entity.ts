import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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

  @Column({ nullable: true })
  createdAt: Date;

  @Column({ nullable: true })
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
}
