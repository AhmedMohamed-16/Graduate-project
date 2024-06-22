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
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UploadService } from 'src/upload/upload.service';
import { ApiTags } from '@nestjs/swagger';
import { IsBooleanPipes } from 'src/common/pipes/user-type-validation.pipe';

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

  @Get()
  async findAll(): Promise<Product[]> {
    return await this.productService.findAll();
  }

  @Get('id/:id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return await this.productService.findById(+id);
  }

  @Get('name/:name')
  async findByName(@Param('name') name: string): Promise<Product> {
    return await this.productService.findByName(name);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.productService.remove(+id);
  }

  // @Get('/top-products/:isTop')
  // async getTopFiveProducts(
  //   @Param('isTop', IsBooleanPipes) isTop: IsBooleanPipes,
  // ) {
  //   return await this.productService.getTopOrBottomProductsByDemand(isTop);
  // }
}
