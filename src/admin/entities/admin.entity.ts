import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity()
export class Admin {
  // Identity Information
  @PrimaryGeneratedColumn()
  id: number;

  // Personal Information
  @Column({ nullable: false })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false })
  phoneNumber: string;

  // Authentication Information
  @Column({ nullable: false, unique: true })
  userName: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: true })
  createdAt: Date;

  @Column({ nullable: true })
  modifiedAt: Date;

  // Hooks and Lifecycle Methods
  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
