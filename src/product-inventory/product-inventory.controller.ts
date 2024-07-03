import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ProductInventoryService } from './product-inventory.service';
import { CreateProductInventoryDto } from './dto/create-product-inventory.dto';
import { UpdateProductInventoryDto } from './dto/update-product-inventory.dto';
import { ProductInventory } from './entities/product-inventory.entity';

import {
  AllowedPeriodPipe,
  ProductFilterPipe,
  ProductInventoryFilerPip,
} from 'src/common/pipes/user-type-validation.pipe';
import { AllowedPeriods } from 'src/common/enums/allowed-periods.enum';
import { ApiTags } from '@nestjs/swagger';
import { ProductFiltersDto } from './dto/product-filter.dto';
import { ProductInventoryFiltersDto } from './dto/product-inv-filter.dto ';

@ApiTags('ProductInventory')
@Controller('products-inventory')
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
  @UsePipes(new ProductFilterPipe())
  async findAllWithFilter(
    @Query()
    filters: ProductFiltersDto,
  ) {
    const { startRange, endRange, categoryId } = filters;
    return await this.productInventoryService.filterProductsInventory(
      startRange,
      endRange,
      categoryId,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductInventoryDto: UpdateProductInventoryDto,
  ) {
    return await this.productInventoryService.update(
      +id,
      updateProductInventoryDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productInventoryService.remove(+id);
  }

  @Get('/total-count/:period')
  async getTotalProductInventoriesCount(
    @Param('period', AllowedPeriodPipe) period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    return await this.productInventoryService.getActiveProductsCount(period);
  }

  @Get('/inventory-of-one-product/')
  @UsePipes(new ProductInventoryFilerPip())
  async findInventoryOfOneProduct(
    @Query() filters: ProductInventoryFiltersDto,
  ) {
    const { productId, miniOffer, maxOffer } = filters;
    return await this.productInventoryService.findInventoryOfOneProduct(
      productId,
      miniOffer,
      maxOffer,
    );
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return await this.productInventoryService.findById(id);
  }
}
