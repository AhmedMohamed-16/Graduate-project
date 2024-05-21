import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductInventoryDto } from './dto/create-product-inventory.dto';
import { UpdateProductInventoryDto } from './dto/update-product-inventory.dto';
import { Between, Repository } from 'typeorm';
import { ProductInventory } from './entities/product-inventory.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreService } from 'src/store/store.service';
import { ProductService } from 'src/product/product.service';
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
export class ProductInventoryService {
  constructor(
    @InjectRepository(ProductInventory)
    private readonly productInventoryRepo: Repository<ProductInventory>,
    private readonly productService: ProductService,
    private readonly storeService: StoreService,
  ) {}

  async create(
    createProductInventoryDto: CreateProductInventoryDto,
  ): Promise<ProductInventory> {
    // Fetch the Product and Store entities by their IDs
    const product = await this.productService.findOne(
      createProductInventoryDto.productId,
    );
    const store = await this.storeService.findById(
      createProductInventoryDto.storeId,
    );

    const newProductInventory = this.productInventoryRepo.create({
      ...createProductInventoryDto,
      priceAfterOffer: parseFloat(
        (
          product.publicPrice *
          (1 - createProductInventoryDto.offerPercent / 100)
        ).toFixed(2),
      ),
      createdAt: new Date(),
      product: product,
      store: store,
    });

    try {
      await this.productInventoryRepo.save(newProductInventory);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create ProductInventory',
      );
    }

    return newProductInventory;
  }

  async findAll(): Promise<ProductInventory[]> {
    return await this.productInventoryRepo.find({
      relations: ['product', 'store'],
    });
  }

  async findOne(id: number): Promise<ProductInventory> {
    const existingProductInventory = await this.productInventoryRepo.findOneBy({
      id: id,
    });

    if (!existingProductInventory) {
      throw new NotFoundException('Product not found in inventory list');
    }
    return existingProductInventory;
  }

  update(id: number, updateProductInventoryDto: UpdateProductInventoryDto) {
    return `This action updates a #${id} productInventory`;
  }

  remove(id: number) {
    return `This action removes a #${id} productInventory`;
  }

  /**
   * Calculates the total count of "ActiveProducts" based on the specified period.
   * @param period - The allowed period (either "all-time", "day", "week", "month", or "year").
   * @returns An object containing the current count of ActiveProducts and the percentage change from the previous period.
   */
  async getActiveProductsCount(
    period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    if (period === AllowedPeriods.ALLTIME) {
      const allTimeProductCount =
        await this.calculateActiveProductCountInPeriod();

      return {
        count: allTimeProductCount,
        percentageChange: 0,
      };
    }

    // Calculate the start and end dates for the current and previous periods
    const {
      currentStartDate,
      currentEndDate,
      previousStartDate,
      previousEndDate,
    } = this.calculateDateRanges(period);

    try {
      // Fetch the product counts for the current period
      const currentCount = await this.calculateActiveProductCountInPeriod(
        currentStartDate,
        currentEndDate,
      );
      // Fetch the product counts for the previous period
      const previousCount = await this.calculateActiveProductCountInPeriod(
        previousStartDate,
        previousEndDate,
      );

      // Calculate the percentage change between the current and previous counts
      const percentageChange = this.calculatePercentageChange(
        currentCount,
        previousCount,
      );

      // Return the current count and percentage change
      return { count: currentCount, percentageChange };
    } catch (error) {
      console.error(
        'An error occurred while counting the ProductInventory:',
        error,
      );
    }
  }

  /**
   * Calculates the count of active products within a specified date range or for all time.
   * @param startDate - The start date of the date range (optional).
   * @param endDate - The end date of the date range (optional).
   * @returns The count of active products in the specified period.
   */
  private async calculateActiveProductCountInPeriod(
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const queryBuilder =
      this.productInventoryRepo.createQueryBuilder('productInventory');
    queryBuilder.select(
      'COUNT(DISTINCT productInventory.productId)',
      'productsCount',
    );

    if (startDate && endDate) {
      queryBuilder.where(
        'productInventory.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    const result = await queryBuilder.getRawOne();
    return result.productsCount;
  }

  /**
   * Calculates the percentage change between the current and previous counts of active products.
   *
   * @param currentCount - The count of active products in the current period.
   * @param previousCount - The count of active products in the previous period.
   *
   * @returns The percentage change between the current and previous counts.
   */
  private calculatePercentageChange(
    currentCount: number,
    previousCount: number,
  ): number {
    console.log(currentCount, previousCount);
    if (currentCount == 0 && previousCount === 0) {
      console.log(0);

      return 0;
    } else if (previousCount == 0 && currentCount > 0) {
      return 100;
    } else if (currentCount == 0 && previousCount > 0) {
      return -100;
    } else if (currentCount !== 0 && previousCount !== 0) {
      return ((currentCount - previousCount) / previousCount) * 100;
    }
  }

  /**
   * Determines the start and end dates for the specified period (day, week, month, or year).
   * @param period - The allowed period (either "day", "week", "month", or "year").
   * currentPeriod : [thisDay ,thisWeek, thisMonth, thisYear]
   * previousPeriod : [yasterDay ,lastWeek, lastMonth, lastYear]
   * @returns An object containing the start and end dates for the current and previous periods.
   */
  private calculateDateRanges(period: AllowedPeriods): {
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
