import {
  BeforeInsert,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ProductInventory } from 'src/product-inventory/entities/product-inventory.entity';
@Entity()
export class Store {
  @PrimaryGeneratedColumn()
  id: number;

  // Store Information
  @Column({ nullable: false })
  storeName: string;

  @Column({ nullable: false })
  country: string;

  @Column({ nullable: false })
  governorate: string;

  @Column({ nullable: false })
  region: string;

  @Column({ nullable: false })
  address: string;

  @Column({ type: 'simple-array', nullable: false })
  contactNumber: string[];

  @Column({ nullable: false })
  email: string;

  // Legal Information
  @Column({ type: 'varchar', nullable: false })
  taxLicense: string;

  @Column({ type: 'varchar', nullable: false })
  taxCard: string;

  @Column({ type: 'varchar', nullable: false })
  commercialRegister: string;

  // account Authentication
  @Column({ nullable: false, unique: true })
  userName: string;

  @Column({ nullable: false })
  password: string;

  // Status and Configuration
  @Column({ nullable: false, default: false })
  isActive: Boolean;

  @Column({ nullable: true })
  createdAt: Date;

  @Column({ nullable: true })
  modifiedAt: Date;

  // Hooks and Lifecycle Methods
  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  @OneToMany(
    () => ProductInventory,
    (productInventory) => productInventory.store,
  )
  productInventories: ProductInventory[];
}
