import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateProductInventoryDto {
 
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  offerPercent: number;
 
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  productId: number;
 
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  storeId: number;
 
}
