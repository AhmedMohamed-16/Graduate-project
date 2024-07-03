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

import { AllowedPeriods } from 'src/common/enums/allowed-periods.enum';
import { CalculationsHelper } from 'src/common/helpers/calculations.helper';
import { ConfigService } from '@nestjs/config';
import { CategoryService } from 'src/category/category.service';

@Injectable()
export class ProductInventoryService {
  constructor(
    @InjectRepository(ProductInventory)
    private readonly productInventoryRepo: Repository<ProductInventory>,
    private readonly productService: ProductService,
    private readonly storeService: StoreService,
    private readonly categoryService: CategoryService,
    private readonly configService: ConfigService,
  ) {}

  async create(
    createProductInventoryDto: CreateProductInventoryDto,
  ): Promise<ProductInventory> {
    // Fetch the Product and Store entities by their IDs
    const product = await this.productService.findById(
      createProductInventoryDto.productId,
    );
    const store = await this.storeService.findOne(
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

  /**
   * Retrieves the inventory of a specific product across each store separately.
   *
   * @param  productId - Mandatory: The ID of the product.
   * @param  miniOffer - Optional: Minimum offer percentage filter.
   * @param  maxOffer  - Optional: Maximum offer percentage filter.
   * @returns {Promise<any[]>} - An array of raw inventory data.
   */
  async findInventoryOfOneProduct(
    productId: number,
    miniOffer?: number,
    maxOffer?: number,
  ): Promise<any[]> {
    const isValidProductId = await this.productService.findById(productId);

    const query = this.productInventoryRepo
      .createQueryBuilder('ProductInventory')
      .leftJoinAndSelect('ProductInventory.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('ProductInventory.store', 'store')
      .select([
        'product.id',
        'product.image',
        'product.name',
        'product.unitsPerPackage',
        'product.publicPrice',
        'category.name',
        'store.storeName',
        'ProductInventory.id',
        'ProductInventory.offerPercent',
        'ProductInventory.amount',
      ])
      .where('product.id = :productId', { productId });

    if (miniOffer !== undefined && maxOffer !== undefined) {
      query.andWhere(
        'ProductInventory.offerPercent >= :miniOffer AND ProductInventory.offerPercent <= :maxOffer',
        { miniOffer, maxOffer },
      );
    }

    return await query.getRawMany();
  }
  /**
   * Retrieve all products that have inventory available across all stores.
   * This method fetches product details and aggregates the quantity of each product across all stores.
   * The quantity represent the available quantity of this product across all stores.
   *
   * @param startRange - Optional: Minimum publicPrice range filter.
   * @param endRange - Optional: Maximum publicPrice range filter.
   * @param categoryId - Optional: Category ID filter.
   * @returns - An array of raw product inventory data.
   */
  async filterProductsInventory(
    startRange?: number,
    endRange?: number,
    categoryId?: number,
  ) {
    if (categoryId !== undefined) {
      const isValidcategoryId = await this.categoryService.findOne(categoryId);
    }

    const query = this.productInventoryRepo
      .createQueryBuilder('productInventory')
      .leftJoinAndSelect('productInventory.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .select([
        'product.id',
        'product.image',
        'product.name',
        'product.unitsPerPackage',
        'product.publicPrice',
        'category.name',
        'SUM(productInventory.amount) as amount',
      ])
      .groupBy('product.id')
      .addGroupBy('category.name');

    if (startRange !== undefined && endRange !== undefined) {
      query.andWhere(
        'product.publicPrice >= :from  AND product.publicPrice <= :to',
        { from: startRange, to: endRange },
      );
    }

    if (categoryId !== undefined) {
      query.andWhere('product.category = :categoryId', { categoryId });
    }

    return await query.getRawMany();
  }

  async findOne(id: number): Promise<ProductInventory> {
    const existingProductInventory = await this.productInventoryRepo.findOneBy({
      id: id,
    });

    if (!existingProductInventory) {
      throw new NotFoundException(
        `ProductInvntory with id ${id} not found in inventory list`,
      );
    }
    return existingProductInventory;
  }

  /**
   * Retrieve detailed information about a specific productInventory by its ID.
   * This includes product details, category, store information, and inventory-specific fields.
   *
   * @param  id - The ID of the product inventory to retrieve.
   * @returns   - A promise that resolves to an object containing detailed product inventory information.
   * @throws {NotFoundException} - If the product inventory with the specified ID does not exist.
   */
  async findById(id: number): Promise<any> {
    const existingProductInventory = await this.findOne(id);

    const query = this.productInventoryRepo
      .createQueryBuilder('ProductInventory')
      .leftJoinAndSelect('ProductInventory.product', 'product')
      .leftJoinAndSelect('ProductInventory.store', 'store')
      .leftJoinAndSelect('product.category', 'category')
      .select([
        'product.name AS productName',
        'product.image AS productImage',
        'category.name AS categoryName',
        'product.unitsPerPackage AS productUnitsPerPackage',
        'product.publicPrice AS productPublicPrice',
        'product.companyName AS productCompanyName',
        'product.therapeuticClass AS productTherapeuticClass',
        'product.activeIngredient AS productActiveIngredient',
        'store.storeName AS storeName',
        'ProductInventory.amount AS inventoryAmount',
        'ProductInventory.offerPercent AS inventoryOfferPercent',
        'ProductInventory.priceAfterOffer AS inventoryPriceAfterOffer',
      ])
      .where('ProductInventory.id = :id', { id });

    return await query.getRawOne();
  }

  async update(
    id: number,
    updateProductInventoryDto: UpdateProductInventoryDto,
  ) {
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

  async findALLByIDS(ids: Array<number>): Promise<ProductInventory[]> {
    const products = await this.productInventoryRepo
      .createQueryBuilder()
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
  save(productInventory: ProductInventory) {
    this.productInventoryRepo.save(productInventory);
  }
}
