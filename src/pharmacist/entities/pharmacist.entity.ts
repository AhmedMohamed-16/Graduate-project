import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pharmacy } from '../../pharmacy/entities/pharmacy.entity';

@Entity()
export class Pharmacist {
  // Legal Information
  @PrimaryColumn({ nullable: false, unique: true })
  licenseNumber: string;

  // Personal Information
  @Column({ nullable: false })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false, length: 11 })
  phoneNumber: string;

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
  @OneToMany(() => Pharmacy, (pharmacy) => pharmacy.pharmacist)
  pharmacies: Pharmacy[];
}
