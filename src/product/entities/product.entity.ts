import { Category } from 'src/category/entities/category.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductInventory } from 'src/product-inventory/entities/product-inventory.entity';

@Entity()
export class Product {
  // Primary key
  @PrimaryGeneratedColumn()
  id: number;

  // Required columns
  
  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  image: string;

 
  @Column({ nullable: false, type: 'decimal', precision: 10, scale: 2 })
  publicPrice: number;
 
  @Column({ nullable: false })
  unitsPerPackage: number; // Number of tablets or ampoules per box

  @Column({ nullable: false })
 
  companyName: string;
 
  // Optional columns

  @Column('text', { array: true, nullable: true })
  activeIngredient: string[];

  @Column('text', { array: true, nullable: true })
  therapeuticClass: string[];

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
  // Relationships

  // Relationship with Category Entity
  @ManyToOne(() => Category, (category) => category.products, {
 
    // cascade: true, 
  })
  category: Category;

  // Relationship with ProductInventory Entity
  @OneToMany(
    () => ProductInventory,
    (productInventory) => productInventory.product,
  )
  productInventories: ProductInventory[];
}
