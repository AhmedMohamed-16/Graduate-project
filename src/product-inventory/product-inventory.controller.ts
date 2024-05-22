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
import { AllowedPeriodPipe } from 'src/common/pipes/user-type-validation.pipe';
import { AllowedPeriods } from 'src/common/enums/user-type.enum';
import { ApiTags } from '@nestjs/swagger';

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
  findAll(): Promise<ProductInventory[]> {
    return this.productInventoryService.findAll();
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

  @Get('/total-count/:period')
  async getTotalProductInventoriesCount(
    @Param('period', AllowedPeriodPipe) period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    return await this.productInventoryService.getActiveProductsCount(period);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductInventory> {
    return await this.productInventoryService.findOne(+id);
  }
}
