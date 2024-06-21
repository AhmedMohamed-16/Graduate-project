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

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly catService: CategoryService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const category = await this.catService.findById(
      createProductDto.categoryID,
    );

    if (await this.isExist(createProductDto)) {
      throw new ConflictException('Product already exists');
    }
    const newProduct: Product = this.productRepo.create({
      ...createProductDto,
      createdAt: new Date(),

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

  async findAll(): Promise<Product[]> {
    const existingProducts = await this.productRepo.find();

    if (!existingProducts) throw new NotFoundException(`there is no products`);
    else return existingProducts;
  }

  async findOne(id: number): Promise<Product> {
    const existingProduct = await this.productRepo.findOneBy({ id });

    if (!existingProduct)
      throw new NotFoundException(`Product with ID ${id} not found`);
    else return existingProduct;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  async remove(id: number): Promise<void> {
    // const result = await this.productRepo.delete(id);
    // if (result.affected == 0)
    //   throw new NotFoundException(`product with id ${id} not found`);
  }

  async isExist(createProductDto: CreateProductDto): Promise<boolean> {
    const category = await this.catService.findById(
      createProductDto.categoryID,
    );

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
  // async getTopOrBottomProductsByDemand(isTop:IsBooleanPipes): Promise<Product[]> {
  //   const order = isTop ? 'DESC' : 'ASC';

  //   const topProducts = await this.productRepo
  //     .createQueryBuilder('product')
  //     .leftJoinAndSelect('product.productInventories', 'productInventory')
  //     .leftJoinAndSelect('productInventory.OrderItemDetail', 'orderItem')
  //     .leftJoinAndSelect('orderItem.orders', 'order')
  //     .select('product.id', 'productId')
  //     .addSelect('product.name', 'productName')
  //     .addSelect('SUM(orderItem.quantity)', 'quantity')
  //     .addSelect('SUM(orderItem.price)', 'totalSales')
  //     .addSelect('COUNT(DISTINCT order.id)', 'orderCount')
  //     .groupBy('product.id')
  //     .orderBy('quantity', order)
  //     .limit(5)
  //     .getRawMany();

  //   return topProducts;
  // }
}
