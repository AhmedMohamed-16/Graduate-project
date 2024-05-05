import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Pharmacy } from '../../pharmacy/entities/pharmacy.entity';
import { timestamp } from 'rxjs';

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

  @Column({ nullable: true })
  createdAt: Date;

  @Column({ nullable: true })
  modifiedAt: Date;

  // Relationships
  @OneToMany(() => Pharmacy, (pharmacy) => pharmacy.pharmacist)
  pharmacies: Pharmacy[];
}
