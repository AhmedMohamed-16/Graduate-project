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
  subYears,
  subMonths,
  subWeeks,
  addDays,
} from 'date-fns';
import { AllowedPeriods } from 'src/common/enums/user-type.enum';

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
  async getTotalStoreCount(
    period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    let periodStart: Date,
      periodEnd: Date,
      previousPeriodStart: Date,
      previousPeriodEnd: Date;

    switch (period) {
      case AllowedPeriods.DAY:
        periodStart = startOfDay(new Date());
        periodEnd = endOfDay(new Date());
        previousPeriodStart = startOfDay(addDays(new Date(), -1)); // Previous day
        previousPeriodEnd = endOfDay(addDays(new Date(), -1));
        break;
      case AllowedPeriods.WEEK:
        periodStart = startOfWeek(new Date(), { weekStartsOn: 6 });
        periodEnd = endOfWeek(new Date(), { weekStartsOn: 6 });
        previousPeriodStart = startOfWeek(subWeeks(new Date(), 1), {
          weekStartsOn: 6,
        }); // Previous week
        previousPeriodEnd = endOfWeek(subWeeks(new Date(), 1), {
          weekStartsOn: 6,
        });
        break;
      case AllowedPeriods.MONTH:
        periodStart = startOfMonth(new Date());
        periodEnd = endOfMonth(new Date());
        previousPeriodStart = startOfMonth(subMonths(new Date(), 1)); // Previous month
        previousPeriodEnd = endOfMonth(subMonths(new Date(), 1));
        break;
      case AllowedPeriods.YEAR:
        periodStart = startOfYear(new Date());
        periodEnd = endOfYear(new Date());
        previousPeriodStart = startOfYear(subYears(new Date(), 1)); // Previous year
        previousPeriodEnd = endOfYear(subYears(new Date(), 1));
        break;
      case AllowedPeriods.ALLTIME:
        return { count: await this.storeRepo.count(), percentageChange: 0 };
    }

    try {
      const [storeCount, previousStoreCount] = await Promise.all([
        this.storeRepo.count({
          where: { createdAt: Between(periodStart, periodEnd) },
        }),
        this.storeRepo.count({
          where: { createdAt: Between(previousPeriodStart, previousPeriodEnd) },
        }),
      ]);

      let percentageChange: number;

      if (
        (storeCount == 0 && previousStoreCount === 0) ||
        previousStoreCount == storeCount
      ) {
        percentageChange = 0;
      } else if (storeCount > previousStoreCount && previousStoreCount == 0) {
        percentageChange = storeCount * +100;
      } else if (previousStoreCount > storeCount && storeCount == 0) {
        percentageChange = previousStoreCount * -100;
      } else {
        percentageChange =
          ((storeCount - previousStoreCount) / previousStoreCount) * 100;
      }

      return { count: storeCount, percentageChange };
    } catch (error) {
      console.error('An error occurred while counting the stores:', error);
    }
  }
}
