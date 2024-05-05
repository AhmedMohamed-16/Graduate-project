import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductInventoryService } from './product-inventory.service';
import { CreateProductInventoryDto } from './dto/create-product-inventory.dto';
import { UpdateProductInventoryDto } from './dto/update-product-inventory.dto';
import { ProductInventory } from './entities/product-inventory.entity';

@Controller('product-inventory')
export class ProductInventoryController {
  constructor(
    private readonly productInventoryService: ProductInventoryService,
  ) {}

  @Post()
  create(
    @Body() createProductInventoryDto: CreateProductInventoryDto,
  ): Promise<ProductInventory> {
    return this.productInventoryService.create(createProductInventoryDto);
  }

  @Get()
  findAll(): Promise<ProductInventory[]> {
    return this.productInventoryService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductInventory> {
    return await this.productInventoryService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductInventoryDto: UpdateProductInventoryDto,
  ) {
    return this.productInventoryService.update(+id, updateProductInventoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productInventoryService.remove(+id);
  }
}
