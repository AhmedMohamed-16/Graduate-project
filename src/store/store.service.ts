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

  /**
   * Calculates the total stores count based on the specified period.
   * If the period is "all-time," returns the overall stores count.
   * Otherwise, computes the stores count within the specified date range.
   * Calculates the percentage change between the current and previous stores counts.
   */
  async getTotalStoresCount(
    period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    if (period === AllowedPeriods.ALLTIME) {
      const totalCount = await this.storeRepo.count();
      return { count: totalCount, percentageChange: 0 };
    }

    const {
      currentStartDate,
      currentEndDate,
      previousStartDate,
      previousEndDate,
    } = this.calculateDateRanges(period);

    try {
      const [storesCount, previousStoresCount] = await Promise.all([
        this.storeRepo.count({
          where: { createdAt: Between(currentStartDate, currentEndDate) },
        }),
        this.storeRepo.count({
          where: { createdAt: Between(previousStartDate, previousEndDate) },
        }),
      ]);

      let percentageChange: number;

      if (
        (storesCount == 0 && previousStoresCount === 0) ||
        previousStoresCount == storesCount
      ) {
        percentageChange = 0;
      } else if (
        storesCount > previousStoresCount &&
        previousStoresCount == 0
      ) {
        percentageChange = storesCount * +100;
      } else if (previousStoresCount > storesCount && storesCount == 0) {
        percentageChange = previousStoresCount * -100;
      } else {
        percentageChange =
          ((storesCount - previousStoresCount) / previousStoresCount) * 100;
      }

      return { count: storesCount, percentageChange };
    } catch (error) {
      console.error('An error occurred while counting the stores:', error);
    }
  }

  /**
   * Determines the start and end dates for the specified period (day, week, month, or year).
   */
  calculateDateRanges(period: AllowedPeriods): {
    currentStartDate: Date;
    currentEndDate: Date;
    previousStartDate: Date;
    previousEndDate: Date;
  } {
    let currentStartDate: Date,
      currentEndDate: Date,
      previousStartDate: Date,
      previousEndDate: Date;

    switch (period) {
      case AllowedPeriods.DAY:
        currentStartDate = startOfDay(new Date());
        currentEndDate = endOfDay(new Date());
        previousStartDate = startOfDay(addDays(new Date(), -1)); // Previous day
        previousEndDate = endOfDay(addDays(new Date(), -1));
        break;
      case AllowedPeriods.WEEK:
        currentStartDate = startOfWeek(new Date(), { weekStartsOn: 6 });
        currentEndDate = endOfWeek(new Date(), { weekStartsOn: 6 });
        previousStartDate = startOfWeek(subWeeks(new Date(), 1), {
          weekStartsOn: 6,
        }); // Previous week
        previousEndDate = endOfWeek(subWeeks(new Date(), 1), {
          weekStartsOn: 6,
        });
        break;
      case AllowedPeriods.MONTH:
        currentStartDate = startOfMonth(new Date());
        currentEndDate = endOfMonth(new Date());
        previousStartDate = startOfMonth(subMonths(new Date(), 1)); // Previous month
        previousEndDate = endOfMonth(subMonths(new Date(), 1));
        break;
      case AllowedPeriods.YEAR:
        currentStartDate = startOfYear(new Date());
        currentEndDate = endOfYear(new Date());
        previousStartDate = startOfYear(subYears(new Date(), 1)); // Previous year
        previousEndDate = endOfYear(subYears(new Date(), 1));
        break;
      case AllowedPeriods.ALLTIME:
    }
    return {
      currentStartDate,
      currentEndDate,
      previousStartDate,
      previousEndDate,
    };
  }
}
