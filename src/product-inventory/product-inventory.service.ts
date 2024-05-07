import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductInventoryDto } from './dto/create-product-inventory.dto';
import { UpdateProductInventoryDto } from './dto/update-product-inventory.dto';
import { Repository } from 'typeorm';
import { ProductInventory } from './entities/product-inventory.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreService } from 'src/store/store.service';
import { ProductService } from 'src/product/product.service';

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

  
}
