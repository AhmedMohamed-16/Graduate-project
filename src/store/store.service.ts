import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './entities/store.entity';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { AllowedPeriods } from 'src/common/enums/allowed-periods.enum';
import { CalculationsHelper } from 'src/common/helpers/calculations.helper';
import { IsBooleanPipes } from 'src/common/pipes/user-type-validation.pipe';

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
    });
    return await this.storeRepo.save(newStore);
  }

  /**
   * Retrieve a list of stores, optionally filtered by store name.
   *
   * If a name is provided, the query filters stores whose names contain the given substring.
   * eles if return all stores.
   *
   * @param name - Optional: The name or partial name of the store to filter by.
   */
  async findStoresByName(name: string) {
    const query = this.storeRepo
      .createQueryBuilder('Store')
      .select([
        'Store.id',
        'Store.storeName',
        'Store.contactNumber',
        'Store.address',
      ]);

    if (name) {
      query.andWhere('Store.storeName LIKE :name ', { name: `%${name}%` });
    }

    return await query.getRawMany();
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

  async update(id: number, updateStoreDto: UpdateStoreDto) {
    let store = await this.findById(id);

    if (store) {
      // update the store instance with the new values
      return await this.storeRepo.save({
        ...store,
        ...updateStoreDto,
      });
    }

    return store;
  }

  remove(id: number) {
    return `This action removes a #${id} store`;
  }

  /**
   * Calculates the total count of "stores" based on the specified period.
   * @param period - The allowed period (either "all-time", "day", "week", "month", or "year").
   * @returns An object containing the current count of stores and the percentage change from the previous period.
   */
  async getTotalStoresCount(
    period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    if (period === AllowedPeriods.ALLTIME) {
      const totalCount = await this.storeRepo.count();
      return { count: totalCount, percentageChange: 0 };
    }

    // Calculate the start and end dates for the current and previous periods
    const {
      currentStartDate,
      currentEndDate,
      previousStartDate,
      previousEndDate,
    } = CalculationsHelper.calculateDateRanges(period);

    try {
      const [currentCount, previousCount] = await Promise.all([
        this.storeRepo.count({
          where: { createdAt: Between(currentStartDate, currentEndDate) },
        }),
        this.storeRepo.count({
          where: { createdAt: Between(previousStartDate, previousEndDate) },
        }),
      ]);

      // Calculate the percentage change between the current and previous counts
      const percentageChange: number =
        CalculationsHelper.calculatePercentageChange(
          currentCount,
          previousCount,
        );
      return { count: currentCount, percentageChange };
    } catch (error) {
      console.error('An error occurred while counting the stores:', error);
    }
  }

  /**
   * Retrieves either the top 5 or bottom 5 stores based on @param isTop.
   * @param isTop - Determines whether to retrieve top stores (true) or bottom stores (false).
   */
  async getTopOrBottomStores(isTop: IsBooleanPipes): Promise<Store[]> {
    const order = isTop ? 'DESC' : 'ASC';

    const topStores = await this.storeRepo
      .createQueryBuilder('Store')
      .leftJoinAndSelect('Store.productInventories', 'productInventory')
      .leftJoinAndSelect('productInventory.orderDetail', 'orderItem')
      .select(['Store.id AS storeId', 'Store.storeName AS storeName'])
      .addSelect('SUM(orderItem.price)', 'price')
      .groupBy('Store.id')
      .having('SUM(orderItem.price) > 0')
      .orderBy('price', order)
      .limit(5)
      .getRawMany();

    return topStores;
  }
}
