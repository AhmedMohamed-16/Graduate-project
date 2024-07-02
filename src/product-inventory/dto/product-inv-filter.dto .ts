import { IsNumber, IsOptional } from 'class-validator';

export class ProductInventoryFiltersDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @IsOptional()
  miniOffer?: number;

  @IsNumber()
  @IsOptional()
  maxOffer?: number;
}
