import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './entities/store.entity';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import e from 'express';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
  ) {}

  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    const existingStore = await this.findByUserName(createStoreDto.userName);
    if (existingStore) {
      throw new Error('Invalid Username');
    }

    const newStore = this.storeRepo.create({
      ...createStoreDto,
      createdAt: new Date(),
    });
    return await this.storeRepo.save(newStore);
  }

  findAll() {
    return `This action returns all store`;
  }

  async findById(id: number) {
    const existingStore = await this.storeRepo.findOneBy({ id });

    if (!existingStore)
      throw new NotFoundException(`Store with ID ${id} not found`);
    else return existingStore;
  }

  async findByUserName(userName: string): Promise<Store | undefined> {
    return await this.storeRepo.findOne({ where: { userName: userName } });
  }

  update(id: number, updateStoreDto: UpdateStoreDto) {
    return `This action updates a #${id} store`;
  }

  remove(id: number) {
    return `This action removes a #${id} store`;

  }
  async getTotalStoreCount(period: string): Promise<number> {
    let periodStart: Date, periodEnd: Date;

    switch (period) {
      case 'd':
        periodStart = startOfDay(new Date());
        periodEnd = endOfDay(new Date());
        break;
      case 'w':
        periodStart = startOfWeek(new Date(), { weekStartsOn: 6 }); // 6 > SutarDay
        periodEnd = endOfWeek(new Date(), { weekStartsOn: 6 });
        break;
      case 'm':
        periodStart = startOfMonth(new Date());
        periodEnd = endOfMonth(new Date());
        break;
      case 'y':
        periodStart = startOfYear(new Date());
        periodEnd = endOfYear(new Date());
        break;
      default:
        return await this.storeRepo.count();
    }

    try {
      const storeCount = await this.storeRepo.count({
        where: {
          createdAt: Between(periodStart, periodEnd),
        },
      });
      return storeCount;
    } catch (error) {
      console.error('An error occurred while counting the stores:', error);
      throw new Error('An error occurred while counting the stores.');
    }
  }
} 

