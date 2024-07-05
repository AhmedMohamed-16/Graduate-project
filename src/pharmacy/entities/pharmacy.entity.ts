import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
 
  OneToMany,
 
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Pharmacist } from '../../pharmacist/entities/pharmacist.entity';
 
import { Order } from 'src/order/entities/order.entity';
 

@Entity()
export class Pharmacy {
  @PrimaryGeneratedColumn()
  id: number;

  // Pharmacy Information
  @Column({ nullable: false })
  pharmacyName: string;

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

  // Legal Information
  @Column({ nullable: false })
  licenseNumber: number;

  @Column({ type: 'varchar', nullable: false })
  commercialRegister: string;

  @Column({ type: 'varchar', nullable: false })
  pharmacyPhoto: string;

  // Account Authentication
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

  // Relationships
  @ManyToOne(() => Pharmacist, (pharmacist) => pharmacist.pharmacies, {
    cascade: true,
  })
  pharmacist: Pharmacist;

 

  ////////////////////////////////new order
  @OneToMany(() => Order, (order:Order) => order.pharmacy, {
  })
  order: Order[];
  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
  //forget password
 @Column({ nullable: true })
 otp: string;

 @Column({ nullable: true })
 otpExpiration: Date;

}
