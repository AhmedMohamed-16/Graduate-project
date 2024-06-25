 
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'; 
import { CreateProductInventoryDto } from './dto/create-product-inventory.dto';
import { UpdateProductInventoryDto } from './dto/update-product-inventory.dto';
import { Repository } from 'typeorm';
import { ProductInventory } from './entities/product-inventory.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreService } from 'src/store/store.service';
import { ProductService } from 'src/product/product.service';

 
import { AllowedPeriods } from 'src/common/enums/user-type.enum';
import { CalculationsHelper } from 'src/common/helpers/calculations.helper';
 
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
    const product = await this.productService.findById(
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
 
  async update(id: number, updateProductInventoryDto: UpdateProductInventoryDto) {
    const productInventory = await this.productInventoryRepo.preload({
      id,
      ...updateProductInventoryDto,
    });

    if (!productInventory) {
      throw new NotFoundException(`There is no order under id ${id}`);
    }

    return this.productInventoryRepo.save(productInventory);
    } 

  remove(id: number) {
    return `This action removes a #${id} productInventory`;
  }

 
  
 async findALLByIDS(ids:Array<number>):Promise<ProductInventory[]>{
  const products = await this.productInventoryRepo.createQueryBuilder()
  .where('id IN(:...ids)', { ids })
  .getMany();

  
  return products;
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
    } = CalculationsHelper.calculateDateRanges(period);

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
      const percentageChange = CalculationsHelper.calculatePercentageChange(
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
}
