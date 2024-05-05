import {
  BeforeInsert,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Pharmacist } from '../../pharmacist/entities/pharmacist.entity';

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

  @Column({ nullable: true })
  createdAt: Date;

  @Column({ nullable: true })
  modifiedAt: Date;

  // Relationships
  @ManyToOne(() => Pharmacist, (pharmacist) => pharmacist.pharmacies, {
    cascade: true,
  })
  pharmacist: Pharmacist;

  // Hooks and Lifecycle Methods
  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
