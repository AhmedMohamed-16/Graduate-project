import { Product } from 'src/product/entities/product.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  createdAt: Date;

  @Column({ nullable: true })
  modifiedAt: Date;


  // Relationships
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
