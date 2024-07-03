import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  BadRequestException,
  UploadedFiles,
  ParseIntPipe,
  UsePipes,
  Query,
  Res,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UploadService } from 'src/upload/upload.service';

import { ApiTags } from '@nestjs/swagger';
import {
  IsBooleanPipes,
  ProductFilterPipe,
} from 'src/common/pipes/user-type-validation.pipe';
import { ProductFiltersDto } from 'src/product-inventory/dto/product-filter.dto';
import {join} from 'path'
@ApiTags('Product')
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  async create(
    @UploadedFiles()
    file: {
      image: Express.Multer.File[];
    },
    @Body()
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    if (!file.image) {
      throw new BadRequestException('Please provide product image.');
    }

    createProductDto.image = await this.uploadService.storeFile(file.image[0]);
    return await this.productService.create(createProductDto);
  }

  @Get('id/:id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return await this.productService.findById(+id);
  }

  @Get('name/:name')
  async findByName(@Param('name') name: string): Promise<Product> {
    return await this.productService.findByName(name);
  }

  @Get('')
  @UsePipes(new ProductFilterPipe())
  async findProductsInventory(
    @Query() productFiltersDto: ProductFiltersDto,
  ): Promise<any> {
    const { startRange, endRange, categoryId } = productFiltersDto;

    return await this.productService.filterProducts(
      startRange,
      endRange,
      categoryId,
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.productService.remove(+id);
  }

  @Get('/top-products/:isTop')
  async getTopFiveProducts(
    @Param('isTop', IsBooleanPipes) isTop: IsBooleanPipes,
  ) {
    return await this.productService.getTopOrBottomProductsByDemand(isTop);
  }
  @Get('getImage')
  async gitImage(@Query('imagName') name: string, @Res() res) {
    return  res.sendFile(join(process.cwd(), `${name}`));
  }
  @Get('getproductDetailsOffers/:id')
  async getproductDetailsOffers(@Param('id', ParseIntPipe) id: number): Promise<any>{
    return await this.productService.productDetailsOffers(+id);
  }
}
