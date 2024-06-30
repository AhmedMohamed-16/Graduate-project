import { IsNumber, IsOptional } from 'class-validator';

export class ProductFiltersDto {
  @IsNumber()
  @IsOptional()
  startRange?: number;

  @IsNumber()
  @IsOptional()
  endRange?: number;
  
  @IsNumber()
  @IsOptional()
  categoryId?: number;
}
