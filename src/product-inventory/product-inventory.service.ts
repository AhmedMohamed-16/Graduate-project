import { Injectable, NotFoundException } from '@nestjs/common';
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

    await this.productInventoryRepo.save(newProductInventory);

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
   * Calculates the total ProductInventories count based on the specified period.
   * If the period is "all-time," returns the overall ProductInventory count.
   * Otherwise, computes the ProductInventories count within the specified date range.
   * Calculates the percentage change between the current and previous ProductInventories counts.
   */
  async getTotalProductInventoriesCount(
    period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    if (period === AllowedPeriods.ALLTIME) {
      const totalCount = await this.productInventoryRepo.count();
      return { count: totalCount, percentageChange: 0 };
    }

    const {
      currentStartDate,
      currentEndDate,
      previousStartDate,
      previousEndDate,
    } = this.calculateDateRanges(period);

    try {
      const [ProductInventoriesCount, previousProductInventoriesCount] =
        await Promise.all([
          this.productInventoryRepo.count({
            where: { createdAt: Between(currentStartDate, currentEndDate) },
          }),
          this.productInventoryRepo.count({
            where: { createdAt: Between(previousStartDate, previousEndDate) },
          }),
        ]);

      let percentageChange: number;

      if (
        (ProductInventoriesCount == 0 &&
          previousProductInventoriesCount === 0) ||
        previousProductInventoriesCount == ProductInventoriesCount
      ) {
        percentageChange = 0;
      } else if (
        ProductInventoriesCount > previousProductInventoriesCount &&
        previousProductInventoriesCount == 0
      ) {
        percentageChange = ProductInventoriesCount * +100;
      } else if (
        previousProductInventoriesCount > ProductInventoriesCount &&
        ProductInventoriesCount == 0
      ) {
        percentageChange = previousProductInventoriesCount * -100;
      } else {
        percentageChange =
          ((ProductInventoriesCount - previousProductInventoriesCount) /
            previousProductInventoriesCount) *
          100;
      }

      return { count: ProductInventoriesCount, percentageChange };
    } catch (error) {
      console.error(
        'An error occurred while counting the ProductInventory:',
        error,
      );
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
