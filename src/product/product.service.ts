import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { CategoryService } from 'src/category/category.service';
import { IsBooleanPipes } from 'src/common/pipes/user-type-validation.pipe';
import { join } from 'path';
import * as fs from 'fs/promises';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly catService: CategoryService,

    private readonly configService: ConfigService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const category = await this.catService.findOne(createProductDto.categoryID);

    if (await this.isExist(createProductDto)) {
      throw new ConflictException('Product already exists');
    }
    const newProduct: Product = this.productRepo.create({
      ...createProductDto,
      name: createProductDto.name.toUpperCase(),
      category: category, // Set the category of the new product

      companyName: createProductDto.companyName.toUpperCase(),
      activeIngredient: createProductDto.activeIngredient.map((name) =>
        name.toUpperCase(),
      ),
      therapeuticClass: createProductDto.therapeuticClass.map((name) =>
        name.toUpperCase(),
      ),
    });
    await this.productRepo.save(newProduct);

    return newProduct;
  }

  async findById(id: number): Promise<Product> {
    const existingProduct = await this.productRepo.findOneBy({ id });

    if (!existingProduct)
      throw new NotFoundException(`Product with ID ${id} not found`);
    else return existingProduct;
  }

  async findByName(name: string): Promise<Product> {
    const existingProduct = await this.productRepo.findOneBy({ name });

    if (!existingProduct)
      throw new NotFoundException(`Product with Name ${name} not found`);
    else return existingProduct;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    let product = await this.findById(id);

    if (product) {
      // Update the product instance with the new values
      product = {
        ...product,
        ...updateProductDto,
      };

      // Save the updated product back to the database
      await this.productRepo.save(product);

      return product;
    }

    return product;
  }

  async remove(id: number): Promise<void> {
    // const result = await this.productRepo.delete(id);
    // if (result.affected == 0)
    //   throw new NotFoundException(`product with id ${id} not found`);
  }
  
  /**
   * this method to check if the product allready exists or not before add new one
   */
  async isExist(createProductDto: CreateProductDto): Promise<boolean> {
    const category = await this.catService.findOne(createProductDto.categoryID);

    const existingProduct = await this.productRepo.findOne({
      where: {
        name: createProductDto.name.toUpperCase(),
        category: category, // rather than line 75
        publicPrice: createProductDto.publicPrice,
      },
    });

    return !!existingProduct;
  }

  /**
   * Retrieve either the top 5 or bottom 5 products upon more demand based on @param isTop.
   * @param isTop - Determines whether to retrieve top products (true) or bottom products (false).
   */
  async getTopOrBottomProductsByDemand(
    isTop: IsBooleanPipes,
  ): Promise<Product[]> {
    const order = isTop ? 'DESC' : 'ASC';

    const topProducts = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.productInventories', 'productInventory')
      .leftJoinAndSelect('productInventory.orderDetail', 'orderItem')
      .leftJoinAndSelect('orderItem.order', 'order')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('SUM(orderItem.quantity)', 'quantity')
      .addSelect('SUM(orderItem.price)', 'totalSales')
      .addSelect('COUNT(DISTINCT order.id)', 'orderCount')
      .groupBy('product.id')
      .having('SUM(orderItem.quantity) > 0') // Ensure only products with orders are returned
      .orderBy('quantity', order)
      .limit(5)
      .getRawMany();

    return topProducts;
  }

  /**
   * Filters products based on optional price range and category ID.
   * This method allows filtering of products by their public price range and category ID.
   *
   * @returns A promise that resolves to an array of filtered products.
   **/
  async filterProducts(
    startRange?: number,
    endRange?: number,
    categoryId?: number,
  ): Promise<any> {
    if (categoryId !== undefined) {
      const ValidcategoryId = await this.catService.findOne(categoryId);
    }

    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .select([
        'product.id As Id',
        'product.image As image',
        'product.name AS name',
        'category.name AS categoryname',
        'product.unitsPerPackage AS unitsPerPackage',
        'product.publicPrice AS publicPrice',
      ]);

    if (startRange !== undefined && endRange !== undefined) {
      query.andWhere(
        'product.publicPrice >= :startRange AND product.publicPrice <= :endRange',
        {
          startRange: startRange,
          endRange: endRange,
        },
      );
    }

    if (categoryId !== undefined) {
      query.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    const products = await query.getRawMany();

    return products;
  }
}
