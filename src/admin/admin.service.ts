import { ConflictException, Injectable } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const existingAdmin = await this.findByUserName(createAdminDto.userName);
    if (existingAdmin) {

      throw new ConflictException(`Invalid Username ${existingAdmin.userName}`);
    }

    const newAdmin = this.adminRepo.create({
      ...createAdminDto,
      createdAt: new Date(),
    });
    return await this.adminRepo.save(newAdmin);
  }

  findAll() {
    return `This action returns all admin`;
  }

  findOne(id: number) {
    return `This action returns a #${id} admin`;
  }

  async findByUserName(userName: string): Promise<Admin | null> {
    const user: Admin = await this.adminRepo.findOne({
      where: { userName: userName },
    });

    return user;
  }

  update(id: number, updateAdminDto: UpdateAdminDto) {
    return `This action updates a #${id} admin`;
  }

  remove(id: number) {
    return `This action removes a #${id} admin`;
  }
}
