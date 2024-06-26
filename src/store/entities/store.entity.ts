import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
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
